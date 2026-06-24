import { ImportResultDto } from "@common/dto/entity-definition/import-result.dto";
import { BaseImportDto } from "@common/interface/base-import.dto";
import { BaseRepository } from "@module/repository/common/base-repository.interface";
import { User } from "@module/user/entities/user.entity";
import { BadRequestException, Type } from "@nestjs/common";
import exceljs from "exceljs";
import { NextFunction, Response } from "express";
import xlsx from "xlsx";
import { BaseImportService } from "./base-import.service";
import { BaseService } from "./base.service";

type MainService = BaseService<any, BaseRepository<any>>;
type ImportService = BaseImportService<any, BaseRepository<any>>;
type ImportItem = {
    service: MainService;
    entity: Type<any>;
    importService?: ImportService;
    importDto?: Type<any>;
};

export abstract class BaseMulltipleMainService {
    constructor(private readonly baseServiceList: ImportItem[]) {}

    private getSheetName(item: {
        service: MainService;
        entity: Type<any>;
    }): string {
        return item.service.getRepository().getEntity() || item.entity.name;
    }

    private async deleteAllRepository(user: User, serviceList: ImportItem[]) {
        for (const { service } of [...serviceList].reverse()) {
            const ids = await service
                .getRepository()
                .getMany(
                    {},
                    { population: [], select: { _id: 1 }, sort: { _id: -1 } },
                )
                .then((list) => list.map((item) => item._id));

            for (const id of ids) {
                await service.deleteOne(user, { _id: id });
            }
        }
    }

    getImportTemplateWb(user: User): exceljs.Workbook {
        const wb = new exceljs.Workbook();

        for (const { service, entity, importDto, importService } of this
            .baseServiceList) {
            const repositoryEntity = this.getSheetName({ service, entity });
            if (!repositoryEntity) {
                throw new BadRequestException(
                    `Import entity name not found from service: ${entity.name}`,
                );
            }
            let getImportTemplateWb: ImportService["getImportTemplateWb"];
            if (importService) {
                getImportTemplateWb = importService.getImportTemplateWb;
            } else {
                getImportTemplateWb =
                    service.getImportService().getImportTemplateWb;
            }
            getImportTemplateWb(user, importDto || entity, {
                wb,
                dataSheetName: repositoryEntity,
            });
        }

        return wb;
    }

    async getImportTemplate(user: User, res: Response, next: NextFunction) {
        try {
            const workbook = this.getImportTemplateWb(user);
            const buffer = await workbook.xlsx.writeBuffer();
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=import-template.xlsx",
            );
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async insertImport(
        user: User,
        file: Buffer | string,
        options?: {
            force?: boolean;
        },
    ): Promise<Array<{ entity: string; result: ImportResultDto }>> {
        options ||= {};
        const workbook =
            typeof file === "string"
                ? xlsx.readFile(file)
                : xlsx.read(file, { type: "buffer" });

        const serviceBySheet = new Map<
            string,
            {
                service: MainService;
                entity: Type<any>;
                importDto?: Type<any>;
            }
        >(this.baseServiceList.map((item) => [this.getSheetName(item), item]));
        const orderedServiceList = workbook.SheetNames.reduce<ImportItem[]>(
            (list, sheetName) => {
                const item = serviceBySheet.get(sheetName);
                if (item) {
                    list.push(item);
                }
                return list;
            },
            [],
        );

        if (options.force) {
            await this.deleteAllRepository(user, orderedServiceList);
        }

        const resultList: Array<{ entity: string; result: ImportResultDto }> =
            [];

        for (const importItem of orderedServiceList) {
            const { service, entity, importDto } = importItem;
            let { importService } = importItem;
            const repositoryEntity = this.getSheetName({ service, entity });
            if (!repositoryEntity) {
                throw new BadRequestException(
                    `Import entity name not found from service: ${service["name"]}`,
                );
            }

            const sheet = workbook.Sheets[repositoryEntity];
            if (!sheet) {
                continue;
            }

            importService ||= service.getImportService();
            const importDefinitions = importService.getImportDefinition(
                user,
                entity,
            );
            const labelToField = new Map<string, string>(
                importDefinitions.map((item) => [item.label, item.field]),
            );

            const jsonRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(
                sheet,
                {
                    defval: null,
                },
            );

            const rows = jsonRows.map((row) => {
                const mappedRow = Object.entries(row).reduce<
                    Record<string, unknown>
                >((result, [columnName, value]) => {
                    const field = labelToField.get(columnName);
                    if (field) {
                        result[field] = value;
                    }
                    return result;
                }, {});
                return mappedRow;
            });

            const dto: BaseImportDto = { rows };
            const result = await importService.insertImport(
                user,
                dto,
                importDto || entity,
                entity,
                {
                    dryRun: false,
                    query: undefined,
                    params: undefined,
                },
            );

            resultList.push({ entity: repositoryEntity, result });
        }

        return resultList;
    }
}
