import {
    convertArrayToPopulate,
    CountQuery,
    CreateQuery,
    DeleteByIdQuery,
    DeleteManyQuery,
    DeleteManyResult,
    DeleteOneQuery,
    DistinctQuery,
    DPQueryScope,
    ExistQuery,
    GetBatchQuery,
    GetByIdQuery,
    GetManyQuery,
    GetMapQuery,
    GetOneQuery,
    GetPageQuery,
    InsertManyQuery,
    UpdateByIdQuery,
    UpdateManyQuery,
    UpdateManyResult,
    UpdateOneQuery,
} from "@common/constant";
import { ImportError } from "@common/constant/class/import-error";
import { CommonQueryDto } from "@common/dto/common-query.dto";
import { ExportQueryDto } from "@common/dto/export-query.dto";
import { PageableDto } from "@common/dto/pageable.dto";
import { BaseEntity } from "@common/interface/base-entity.interface";
import { SqlUtil } from "@common/utils/sql.ulti";
import { CommonProviderService } from "@module/common-provider/common-provider.service";
import {
    combineConditions,
    DATA_PARTITION_FIELD,
} from "@module/data-partition/common/constant";
import { DpConfig } from "@module/data-partition/common/type";
import { Inject, Type } from "@nestjs/common";
import {
    BaseError,
    col,
    DatabaseError,
    FindAttributeOptions,
    fn,
    Op,
    Transaction,
    ValidationError,
} from "sequelize";
import { Model, ModelCtor } from "sequelize-typescript";
import { EntityValue } from "..";
import {
    BaseCommandOption,
    BaseQueryOption,
    BaseRepository,
    BaseRepositoryOption,
    CreateDocument,
    QueryCondition,
    UpdateDocument,
} from "../common/base-repository.interface";

export abstract class SqlRepository<
    E extends BaseEntity,
> implements BaseRepository<E, Transaction> {
    @Inject(CommonProviderService)
    public readonly cps: CommonProviderService;
    private dpConfig: DpConfig;
    private entity: EntityValue;

    constructor(
        private readonly model: ModelCtor<Model<E>>,
        private readonly option: BaseRepositoryOption<E> = {},
    ) {}

    getEntity(): EntityValue {
        return this.entity;
    }
    setEntity(entity: EntityValue) {
        this.entity = entity;
    }
    getDpConfig(): DpConfig {
        return this.dpConfig;
    }
    setDpConfig(dpConfig: DpConfig): void {
        this.dpConfig = dpConfig;
    }

    getDataPartitionRecord(
        options: Pick<CommonQueryDto, "enableDataPartition">,
    ): Record<string, string> {
        const enable =
            options?.enableDataPartition ??
            this.cps.isDpEnable(this.getDpConfig());
        if (enable === false) {
            return {};
        }
        const dataPartition = this.cps.dpiService.getClsDataPartition();
        if (dataPartition) {
            const key =
                this.option.dataPartition?.mapping || DATA_PARTITION_FIELD;
            switch (typeof key) {
                case "string": {
                    return { [key]: dataPartition.ma };
                }
            }
        }
        return {};
    }

    getDataPartitionCondition(
        options: Pick<CommonQueryDto, "enableDataPartition">,
    ): QueryCondition<E> {
        const enable =
            options?.enableDataPartition ??
            this.cps.isDpEnable(this.getDpConfig());
        if (enable === false) {
            return {};
        }
        const dataPartition = this.cps.dpiService.getClsDataPartition();
        const queryMode = this.cps.dpiService.getQueryMode();
        if (dataPartition) {
            const key =
                this.option.dataPartition?.mapping || DATA_PARTITION_FIELD;
            let filterKey: string;
            switch (typeof key) {
                case "string": {
                    filterKey = key;
                    break;
                }
                case "object": {
                    if (Array.isArray(key)) {
                        filterKey = `$${key.join(".")}$`;
                    }
                    break;
                }
            }
            if (filterKey) {
                switch (queryMode) {
                    case DPQueryScope.NODE: {
                        return {
                            [filterKey]: dataPartition.ma,
                        } as QueryCondition<E>;
                    }
                    case DPQueryScope.SUBTREE: {
                        return {
                            [filterKey]: {
                                $in:
                                    this.cps.dpiService
                                        .getClsDPSubtree()
                                        ?.map((item) => item.ma) || [],
                            },
                        } as QueryCondition<E>;
                    }
                    case DPQueryScope.ROOT_PATH: {
                        return {
                            [filterKey]: {
                                $in:
                                    this.cps.dpiService
                                        .getClsDPRootPath()
                                        ?.map((item) => item.ma) || [],
                            },
                        } as QueryCondition<E>;
                    }
                }
            }
        }
        return {};
    }

    getDataPartitionPopulate(
        options: Pick<CommonQueryDto, "enableDataPartition">,
    ) {
        const enable =
            options?.enableDataPartition ??
            this.cps.isDpEnable(this.getDpConfig());
        if (enable === false) {
            return [];
        }
        const key = this.option.dataPartition?.mapping || DATA_PARTITION_FIELD;
        switch (typeof key) {
            case "string": {
                return [];
            }
            case "object": {
                if (Array.isArray(key)) {
                    return convertArrayToPopulate(key);
                }
                return [];
            }
        }
    }

    private getPopulation(
        queryPopulation?: CommonQueryDto<E>["population"],
        defaultPopulation?: CommonQueryDto<E>["population"],
        options?: Pick<CommonQueryDto, "enableDataPartition">,
    ): CommonQueryDto<E>["population"] {
        return [
            ...(queryPopulation ?? defaultPopulation ?? []),
            ...this.getDataPartitionPopulate(options),
        ];
    }

    private getParanoidOption(query?: Pick<CommonQueryDto, "softDelete">): {
        paranoid?: boolean;
    } {
        if (query?.softDelete === undefined) {
            return {};
        }
        return { paranoid: query.softDelete === true };
    }

    async create(
        document: CreateDocument<E>,
        query?: CreateQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<E> {
        const partitionRecord = this.getDataPartitionRecord(query);
        Object.assign(document, partitionRecord);
        const res = await this.model.create(document as any, {
            transaction: query?.transaction,
            include: SqlUtil.getIncludeable(query?.population),
            hooks: !query?.plain,
        });
        return res.toJSON();
    }

    async insertMany(
        documents: Partial<E>[],
        options?: InsertManyQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<{ n: number }> {
        const partitionRecord = this.getDataPartitionRecord(options);
        const res = await this.model.bulkCreate(
            documents.map((doc) => Object.assign(doc, partitionRecord) as any),
            { transaction: options?.transaction, hooks: !options?.plain },
        );
        return { n: res.length };
    }

    async getById(
        id: string,
        query?: GetByIdQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<E | null> {
        const population = this.getPopulation(
            query?.population,
            this.option?.populate?.getById,
            query,
        );
        const include = SqlUtil.getIncludeable(population);
        const partitionCondition = this.getDataPartitionCondition(query);
        const condition = { ...partitionCondition, _id: id } as any;
        const attributes = SqlUtil.getAttributes(query?.select, include);
        const res = await this.model.findOne({
            include,
            attributes,
            where: SqlUtil.getCondition(condition, query?.filters),
            transaction: query?.transaction,
        });
        return res?.toJSON() || null;
    }

    async getOne(
        conditions: QueryCondition<E>,
        query?: GetOneQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<E | null> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const population = this.getPopulation(
            query?.population,
            this.option?.populate?.getOne,
            query,
        );
        const include = SqlUtil.getIncludeable(population);
        const attributes = SqlUtil.getAttributes(query?.select, include);
        const res = await this.model.findOne({
            include,
            attributes,
            where: SqlUtil.getCondition(finalCondition, query?.filters),
            order: SqlUtil.getOrder(query?.sort),
            transaction: query?.transaction,
            ...this.getParanoidOption(query),
        });
        return res?.toJSON() || null;
    }

    async getMany(
        conditions: QueryCondition<E>,
        query?: GetManyQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<E[]> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const population = this.getPopulation(
            query?.population,
            this.option?.populate?.getMany,
            query,
        );
        const include = SqlUtil.getIncludeable(population);
        const attributes = SqlUtil.getAttributes(query?.select, include);
        const res = await this.model.findAll({
            where: SqlUtil.getCondition(finalCondition, query?.filters),
            include,
            attributes,
            order: SqlUtil.getOrder(query?.sort),
            transaction: query?.transaction,
            ...this.getParanoidOption(query),
        });
        return res.map((doc) => doc.toJSON());
    }

    async getPage(
        conditions: QueryCondition<E>,
        query?: GetPageQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<PageableDto<E>> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const population = this.getPopulation(
            query?.population,
            this.option?.populate?.getPage,
            query,
        );
        const include = SqlUtil.getIncludeable(population);
        const attributes = SqlUtil.getAttributes(query?.select, include);
        const [rows, count] = await Promise.all([
            await this.model
                .findAll({
                    where: SqlUtil.getCondition(finalCondition, query?.filters),
                    include,
                    attributes,
                    offset: query?.skip,
                    limit: query?.limit,
                    order: SqlUtil.getOrder(query?.sort),
                    // subQuery: false,
                    ...this.getParanoidOption(query),
                })
                .then((list) => list.map((row) => row.toJSON())),
            await this.model.count({
                where: SqlUtil.getCondition(finalCondition, query?.filters),
                include,
                transaction: query?.transaction,
                col: this.model.primaryKeyAttribute,
                distinct: true,
                ...this.getParanoidOption(query),
            }),
        ]);
        return PageableDto.create(query, count, rows as any[]);
    }

    async *getBatch(
        conditions: any,
        query?: GetBatchQuery<E> & BaseQueryOption<Transaction>,
    ): AsyncGenerator<E[], E[], void> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        let previousId: string;
        while (true) {
            if (previousId) {
                Object.assign(finalCondition, { _id: { [Op.gt]: previousId } });
            }
            const population = this.getPopulation(
                query?.population,
                this.option?.populate?.getBatch,
                query,
            );
            const include = SqlUtil.getIncludeable(population);
            const attributes = SqlUtil.getAttributes(query?.select, include);
            const res = await this.model
                .findAll({
                    where: finalCondition,
                    include,
                    attributes,
                    limit: query?.limit,
                    order: [["_id", "ASC"]],
                    transaction: query?.transaction,
                })
                .then((list) => list.map((row) => row.toJSON()));
            if (res.length > 0) {
                yield res as any[];
                previousId = res[res.length - 1]._id;
            } else {
                return;
            }
        }
    }

    async distinct<Type = any>(
        field: string,
        conditions?: QueryCondition<E>,
        query?: DistinctQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<Type[]> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        query ||= {};
        const { transaction, filters } = query;
        const population = this.getPopulation(
            query?.population,
            undefined,
            query,
        );
        const distintField = "_distinct_field";
        const attributes: FindAttributeOptions = [
            [fn("DISTINCT", col(field)), distintField],
        ];
        if (population) {
            attributes.push(this.model.primaryKeyAttribute);
        }
        return this.model
            .findAll({
                where: SqlUtil.getCondition(finalCondition, filters),
                transaction,
                include: SqlUtil.getIncludeable(population),
                attributes,
                ...this.getParanoidOption(query),
            })
            .then((list) =>
                Array.from(
                    new Set(
                        list.map((item) => {
                            return item.get(distintField) as Type;
                        }),
                    ),
                ),
            );
    }

    async updateById(
        id: string,
        update: UpdateDocument<E>,
        query?: UpdateByIdQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<E | null> {
        return this.updateOne({ _id: id }, update, query);
    }

    async updateOne(
        conditions: QueryCondition<E>,
        update: UpdateDocument<E>,
        query?: UpdateOneQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<E | null> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        query = query || {};
        query.new = query.new ?? true;
        update = SqlUtil.getUpdate(update);
        let res: Model<E, E> | null = null;
        const finalSqlCondition = SqlUtil.getCondition<E>(
            finalCondition,
            query.filters,
        );
        if (query.upsert === true) {
            const doc = Object.assign({}, finalSqlCondition, update) as any;
            [res] = await this.model.upsert(doc as any, {
                conflictFields: Object.keys(finalSqlCondition) as Array<
                    keyof E
                >,
                conflictWhere: finalSqlCondition,
                transaction: query.transaction,
                hooks: !query.plain,
            });
        } else {
            const population = this.getPopulation(undefined, undefined, query);
            const doc = await this.model.findOne({
                where: finalSqlCondition,
                transaction: query.transaction,
                order: SqlUtil.getOrder(query.sort),
                include: SqlUtil.getIncludeable(population),
            });
            if (doc) {
                res = await doc.update(update as any, {
                    transaction: query.transaction,
                    hooks: !query.plain,
                });
            }
        }
        if (res) {
            return query.new === true ? res.toJSON() : (res.toJSON() as E);
        }
        return null;
    }

    async updateMany(
        conditions: QueryCondition<E>,
        update: UpdateDocument<E>,

        query?: UpdateManyQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<UpdateManyResult> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        query = query || {};
        query.new = query.new ?? true;
        update = SqlUtil.getUpdate(update);
        const finalSqlCondition = SqlUtil.getCondition(
            finalCondition,
            query.filters,
        );
        const [affected] = await this.model.update(update as any, {
            where: finalSqlCondition,
            transaction: query.transaction,
            hooks: !query.plain,
        });
        return { n: affected, affected };
    }

    async deleteById(
        id: string,
        query?: DeleteByIdQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<E | null> {
        return this.deleteOne({ _id: id }, query);
    }

    async deleteOne(
        conditions: QueryCondition<E>,
        query?: DeleteOneQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<E | null> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const finalSqlCondition = SqlUtil.getCondition(
            finalCondition,
            query?.filters,
        );
        const population = this.getPopulation(undefined, undefined, query);
        const res = await this.model.findOne({
            where: finalSqlCondition,
            order: SqlUtil.getOrder(query?.sort),
            transaction: query?.transaction,
            include: SqlUtil.getIncludeable(population),
        });
        if (res) {
            await res.destroy({
                transaction: query?.transaction,
                hooks: !query?.plain,
            });
            return res.toJSON();
        }
        return null;
    }

    async deleteMany(
        conditions: QueryCondition<E>,
        query?: DeleteManyQuery<E> & BaseCommandOption<Transaction>,
    ): Promise<DeleteManyResult> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const finalSqlCondition = SqlUtil.getCondition(
            finalCondition,
            query?.filters,
        );
        const res = await this.model.destroy({
            where: finalSqlCondition,
            transaction: query?.transaction,
            hooks: !query?.plain,
        });
        return {
            n: res,
            deleted: res,
        };
    }

    async exists(
        conditions?: QueryCondition<E>,
        query?: ExistQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<boolean> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const population = this.getPopulation(
            query?.population,
            undefined,
            query,
        );
        const include = SqlUtil.getIncludeable(population);
        const finalSqlCondition = SqlUtil.getCondition(
            finalCondition,
            query?.filters,
        );
        const res = await this.model.findOne({
            where: finalSqlCondition,
            attributes: { include: ["_id"] },
            include,
            transaction: query?.transaction,
            ...this.getParanoidOption(query),
        });
        return !!res;
    }

    count(
        conditions?: QueryCondition<E>,
        query?: CountQuery<E> & BaseQueryOption<Transaction>,
    ): Promise<number> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const finalSqlCondition = SqlUtil.getCondition(
            finalCondition,
            query?.filters,
        );
        const population = this.getPopulation(
            query?.population,
            undefined,
            query,
        );
        const include = SqlUtil.getIncludeable(population);
        return this.model.count({
            where: finalSqlCondition,
            transaction: query?.transaction,
            include,
            col: this.model.primaryKeyAttribute,
            distinct: true,
            ...this.getParanoidOption(query),
        });
    }

    async getExport(
        entity: Type<E>,
        conditions: QueryCondition<E>,
        query: CommonQueryDto<E>,
        exportQuery: ExportQueryDto & BaseQueryOption<Transaction>,
    ): Promise<E[]> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        query = query || {};
        const population = this.getPopulation(
            query.population,
            this.option?.populate?.getExport,
            query,
        );
        const finalQuery = SqlUtil.getExportQuery(
            entity,
            finalCondition,
            { ...query, population },
            exportQuery,
        );
        const res = await this.model.findAll(finalQuery);
        return res.map((doc) => doc.toJSON());
    }

    getRepositoryErrors(err: Error): string[] {
        let defaultErrors: string[];
        if (err instanceof ImportError) {
            defaultErrors = err.getMessages();
        } else if (err instanceof ValidationError) {
            defaultErrors = err.errors.map((e) => e.message);
        } else if (err instanceof DatabaseError) {
            defaultErrors = [err.original.message];
        } else if (err instanceof BaseError) {
            defaultErrors = [err.name];
        } else {
            defaultErrors = [err.message];
        }
        return defaultErrors;
    }

    async getMap(
        keys: (keyof E)[],
        condition: QueryCondition<E>,
        query?: Omit<GetMapQuery<E>, "listValue"> &
            BaseQueryOption<Transaction> & {
                listValue: false | undefined | null;
            },
    ): Promise<Record<string, E>>;
    async getMap(
        keys: (keyof E)[],
        condition: QueryCondition<E>,
        query?: Omit<GetMapQuery<E>, "listValue"> &
            BaseQueryOption<Transaction> & { listValue: true },
    ): Promise<Record<string, E[]>>;
    async getMap(
        keys: (keyof E)[],
        conditions: QueryCondition<E>,
        query?: Pick<
            CommonQueryDto<E>,
            "select" | "sort" | "filters" | "population" | "enableDataPartition"
        > & {
            separator?: string;
            listValue?: boolean;
        } & BaseQueryOption<Transaction>,
    ): Promise<Record<string, E | E[]>> {
        conditions = conditions || {};
        query ??= {};
        const list = await this.getMany(conditions, query);
        const separator = query.separator || ",";
        return list.reduce<Record<string, E | E[]>>((map, item) => {
            const dataKeys = keys.map((key) => item[key]).join(separator);
            if (!query.listValue) {
                return Object.assign(map, {
                    [dataKeys]: item,
                });
            } else {
                map[dataKeys] ??= [];
                (map[dataKeys] as E[]).push(item);
                return map;
            }
        }, {});
    }
}
