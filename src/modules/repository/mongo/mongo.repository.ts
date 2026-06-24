import {
    convertArrayToPopulate,
    CountQuery,
    CreateQuery,
    DeleteByIdQuery,
    DeleteManyQuery,
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
    UpdateOneQuery,
} from "@common/constant";
import { CommonQueryDto } from "@common/dto/common-query.dto";
import { ExportQueryDto } from "@common/dto/export-query.dto";
import { PageableDto } from "@common/dto/pageable.dto";
import { BaseEntity } from "@common/interface/base-entity.interface";
import { MongoUtil } from "@common/utils/mongo.util";
import { ObjectUtil } from "@common/utils/object.util";
import { CommonProviderService } from "@module/common-provider/common-provider.service";
import {
    combineConditions,
    DATA_PARTITION_FIELD,
} from "@module/data-partition/common/constant";
import { DpConfig } from "@module/data-partition/common/type";
import {
    BaseCommandOption,
    BaseQueryOption,
    BaseRepository,
    BaseRepositoryOption,
    QueryCondition,
    UpdateDocument,
} from "@module/repository/common/base-repository.interface";
import { Inject, Type } from "@nestjs/common";
import { ClientSession, Model, QueryFilter } from "mongoose";
import { EntityValue } from "..";

export abstract class MongoRepository<
    E extends BaseEntity,
> implements BaseRepository<E, ClientSession> {
    @Inject(CommonProviderService)
    public readonly cps: CommonProviderService;
    private dpConfig: DpConfig;
    private entity: EntityValue;

    constructor(
        private readonly model: Model<E>,
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
                case "object": {
                    if (Array.isArray(key)) {
                        return { [key.join(".")]: dataPartition.ma };
                    }
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
                        filterKey = `${key.join(".")}`;
                    }
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
    ): CommonQueryDto<E>["population"] {
        return [...(queryPopulation ?? defaultPopulation ?? [])];
    }

    async create(
        document: Partial<E>,
        query?: CreateQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<E> {
        const partitionRecord = this.getDataPartitionRecord(query);
        Object.assign(document, partitionRecord);
        const doc = new this.model(document);
        return doc.save({ session: query?.transaction });
    }

    async insertMany(
        documents: Partial<E>[],
        options?: InsertManyQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<{ n: number }> {
        const partitionRecord = this.getDataPartitionRecord(options);
        const res = await this.model.insertMany(
            documents.map((doc) => Object.assign(doc, partitionRecord)),
            {
                rawResult: true,
                ordered: true,
                session: options?.transaction,
            },
        );
        return { n: res.insertedCount };
    }

    getById(
        id: string,
        query?: GetByIdQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<E | null> {
        const partitionCondition = this.getDataPartitionCondition(query);
        const condition = { _id: id, ...partitionCondition };
        const mongooseOptions = this.getMongooseOption(query);
        return this.model
            .findOne(condition)
            .populate<any>(
                MongoUtil.getPopulate<E>(
                    this.getPopulation(
                        query?.population,
                        this.option.populate?.getById,
                    ),
                ),
            )
            .setOptions({ ...mongooseOptions, session: query?.transaction })
            .lean<E>({ defaults: true, getters: true, virtuals: true })
            .exec();
    }

    getOne(
        conditions: QueryFilter<E>,
        query?: GetOneQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<E | null> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const mongooseOptions = this.getMongooseOption(query);
        return this.model
            .findOne(MongoUtil.getCondition(finalCondition, query?.filters))
            .populate<any>(
                MongoUtil.getPopulate(
                    this.getPopulation(
                        query?.population,
                        this.option.populate?.getOne,
                    ),
                ),
            )
            .setOptions({ ...mongooseOptions, session: query?.transaction })
            .lean<E>({ defaults: true, getters: true, virtuals: true })
            .exec();
    }

    getMany(
        conditions: QueryFilter<E>,
        query?: GetManyQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<E[]> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const mongooseOptions = this.getMongooseOption(query);
        return this.model
            .find(MongoUtil.getCondition(finalCondition, query?.filters))
            .populate<any>(
                MongoUtil.getPopulate(
                    this.getPopulation(
                        query?.population,
                        this.option.populate?.getMany,
                    ),
                ),
            )
            .setOptions({ ...mongooseOptions, session: query?.transaction })
            .lean<E[]>({ defaults: true, getters: true, virtuals: true })
            .exec();
    }

    async getPage(
        conditions: QueryFilter<E>,
        query?: GetPageQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<PageableDto<any>> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        let finalCondition = combineConditions(conditions, partitionCondition);
        const mongooseOptions = this.getMongooseOption(query);
        finalCondition = MongoUtil.getCondition(finalCondition, query?.filters);
        const [total, result] = await Promise.all([
            this.count(conditions, query),
            this.model
                .find(finalCondition, undefined, mongooseOptions)
                .populate<any>(
                    MongoUtil.getPopulate(
                        this.getPopulation(
                            query?.population,
                            this.option.populate?.getPage,
                        ),
                    ),
                )
                .setOptions({
                    session: query?.transaction,
                })
                .lean({ defaults: true, getters: true, virtuals: true }),
        ]);
        return PageableDto.create(query, total, result);
    }

    async *getBatch(
        conditions: any,
        query?: GetBatchQuery<E> & BaseQueryOption<ClientSession>,
    ): AsyncGenerator<E[], E[], void> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        let previousId: string;
        const mongooseOptions = this.getMongooseOption(query);
        mongooseOptions.sort = mongooseOptions.sort || {};
        mongooseOptions.sort = Object.assign({ _id: 1 }, mongooseOptions.sort);
        while (true) {
            if (previousId) {
                Object.assign(finalCondition, { _id: { $gt: previousId } });
            }
            const res = await this.model
                .find(finalCondition)
                .populate(
                    MongoUtil.getPopulate(
                        this.getPopulation(
                            query?.population,
                            this.option.populate?.getBatch,
                        ),
                    ),
                )
                .setOptions({
                    ...mongooseOptions,
                    session: query?.transaction,
                })
                .lean<E[]>({ defaults: true, getters: true, virtuals: true });
            if (res.length > 0) {
                yield res;
                previousId = res[res.length - 1]._id;
            } else {
                return;
            }
        }
    }

    async distinct<Type extends string = string>(
        field: string,
        conditions?: any,
        query?: DistinctQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<Type[]> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        let finalCondition = combineConditions(conditions, partitionCondition);
        const { transaction, filters } = query || {};
        finalCondition = MongoUtil.getCondition(finalCondition, filters);
        const res = await this.model
            .distinct(field, finalCondition)
            .session(transaction);
        return res as Type[];
    }

    updateById(
        id: string,
        update: UpdateDocument<E>,
        query?: UpdateByIdQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<E | null> {
        return this.updateOne({ _id: id }, update, query);
    }

    updateOne(
        conditions: QueryFilter<E>,
        update: UpdateDocument<E>,
        query?: UpdateOneQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<E | null> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const { transaction, ...options } = query || {};
        options.new = options.new ?? true;
        return this.model
            .findOneAndUpdate(
                MongoUtil.getCondition(finalCondition, query?.filters),
                MongoUtil.getUpdate(update),
                {
                    ...options,
                    session: transaction,
                },
            )
            .lean<E>({ defaults: true, getters: true, virtuals: true })
            .exec();
    }

    async updateMany(
        conditions: QueryFilter<E>,
        update: UpdateDocument<E>,
        query?: UpdateManyQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<{ n?: number; affected: number }> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const { transaction, ...options } = query || {};
        options.new = options.new ?? true;
        const res = await this.model.updateMany(
            MongoUtil.getCondition(finalCondition, query?.filters),
            MongoUtil.getUpdate(update),
            {
                ...options,
                session: transaction,
            },
        );
        const affected = res.modifiedCount + res.upsertedCount;
        return { n: res.matchedCount, affected };
    }

    async deleteById(
        id: string,
        query?: DeleteByIdQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<E | null> {
        return this.deleteOne({ _id: id }, query);
    }

    deleteOne(
        conditions: QueryFilter<E>,
        query?: DeleteOneQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<E | null> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const { transaction, ...options } = query || {};
        return this.model
            .findOneAndDelete(
                MongoUtil.getCondition(finalCondition, query?.filters),
                {
                    ...options,
                    session: transaction,
                },
            )
            .lean<E>({ defaults: true, getters: true, virtuals: true })
            .exec();
    }

    async deleteMany(
        conditions: QueryFilter<E>,
        query?: DeleteManyQuery<E> & BaseCommandOption<ClientSession>,
    ): Promise<{
        n?: number;
        deleted: number;
    }> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const { transaction } = query || {};
        const res = await this.model.deleteMany(
            MongoUtil.getCondition(finalCondition, query?.filters),
            {
                session: transaction,
            },
        );
        return { deleted: res.deletedCount };
    }

    async exists(
        conditions?: QueryFilter<E>,
        query?: ExistQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<boolean> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        const finalCondition = combineConditions(
            conditions,
            partitionCondition,
        );
        const res = await this.model
            .exists(MongoUtil.getCondition(finalCondition, query?.filters))
            .session(query?.transaction);
        return Boolean(res?._id);
    }

    count(
        conditions?: any,
        query?: CountQuery<E> & BaseQueryOption<ClientSession>,
    ): Promise<number> {
        conditions = conditions || {};
        const partitionCondition = this.getDataPartitionCondition(query);
        let finalCondition = combineConditions(conditions, partitionCondition);
        finalCondition = MongoUtil.getCondition(finalCondition, query?.filters);
        if (
            ObjectUtil.isEmptyObject(finalCondition) &&
            !this.model.baseModelName
        ) {
            return this.model
                .estimatedDocumentCount({ session: query?.transaction })
                .exec();
        } else {
            return this.model
                .countDocuments(finalCondition, { session: query?.transaction })
                .exec();
        }
    }

    getMongooseOption(query: CommonQueryDto<E>) {
        const option: Partial<CommonQueryDto<E>> = {};
        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (["select", "sort", "skip", "limit"].includes(key)) {
                    option[key] = value;
                }
            });
        }
        return option;
    }

    async getExport(
        entity: Type<E>,
        conditions: QueryCondition<E>,
        query: CommonQueryDto<E>,
        exportQuery: ExportQueryDto & BaseQueryOption<ClientSession>,
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
            this.option.populate?.getExport,
        );
        const finalQuery = MongoUtil.getExportQuery(
            entity,
            finalCondition,
            { ...query, population },
            exportQuery,
        );
        const { filter, populate, select } = finalQuery;
        const { transaction } = exportQuery;
        const res = await this.model
            .find(filter)
            .select(select)
            .populate(populate)
            .session(transaction)
            .lean<E[]>({ defaults: true, getters: true, virtuals: true });
        return res;
    }

    getRepositoryErrors(err: Error): string[] {
        return [err.message];
    }

    async getMap(
        keys: (keyof E)[],
        condition: QueryCondition<E>,
        query?: Omit<GetMapQuery<E>, "listValue"> &
            BaseQueryOption<ClientSession>,
    ): Promise<Record<string, E>>;
    async getMap(
        keys: (keyof E)[],
        condition: QueryCondition<E>,
        query?: Omit<GetMapQuery<E>, "listValue"> &
            BaseQueryOption<ClientSession> & { listValue: true },
    ): Promise<Record<string, E[]>>;
    async getMap(
        keys: (keyof E)[],
        conditions: QueryCondition<E>,
        query?: GetMapQuery<E> & BaseQueryOption<ClientSession>,
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
