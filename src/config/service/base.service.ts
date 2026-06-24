import {
    CreateQuery,
    DeleteManyQuery,
    DeleteOneQuery,
    GetByIdQuery,
    GetManyQuery,
    GetOneQuery,
    GetPageQuery,
    UpdateByIdQuery,
    UpdateManyQuery,
    UpdateOneQuery,
} from "@common/constant";
import { DeleteManyByIdsDto } from "@common/dto/delete-many-by-ids.dto";
import { BaseEntity } from "@common/interface/base-entity.interface";
import {
    TRANSFORM_ENTITY_LABEL_PROVIDER,
    TransformEntityLabel,
} from "@common/provider/transform-entity-label.provider";
import {
    TRANSFORM_ERROR_MESSAGE_PROVIDER,
    TransformErrorMessage,
} from "@common/provider/transform-error-message.provider";
import { ApiError } from "@config/exception/api-error";
import { ErrorCode } from "@config/exception/error-code";
import {
    BaseQueryOption,
    BaseRepository,
    CreateDocument,
    QueryCondition,
    UpdateDocument,
} from "@module/repository/common/base-repository.interface";
import { BaseTransaction } from "@module/repository/common/base-transaction.interface";
import { MongoRepository } from "@module/repository/mongo/mongo.repository";
import { MongoTransaction } from "@module/repository/mongo/mongo.transaction";
import { SqlRepository } from "@module/repository/sequelize/sql.repository";
import { SqlTransaction } from "@module/repository/sequelize/sql.transaction";
import { SettingService } from "@module/setting/setting.service";
import { User } from "@module/user/entities/user.entity";
import {
    BadRequestException,
    forwardRef,
    Inject,
    OnModuleInit,
} from "@nestjs/common";
import _ from "lodash";
import { BaseImportService } from "./base-import.service";

export class BaseService<
    E extends BaseEntity,
    R extends BaseRepository<E> = BaseRepository<E>,
> implements OnModuleInit {
    @Inject(MongoTransaction)
    private readonly mongoTransaction: MongoTransaction;

    @Inject(SqlTransaction)
    private readonly sqlTransaction: SqlTransaction;

    @Inject(forwardRef(() => SettingService))
    private readonly biSettingService: SettingService;

    @Inject(forwardRef(() => TRANSFORM_ERROR_MESSAGE_PROVIDER))
    private transformErrorMessage: TransformErrorMessage;

    @Inject(forwardRef(() => TRANSFORM_ENTITY_LABEL_PROVIDER))
    private transformEntityLabel: TransformEntityLabel;

    async onModuleInit() {
        const transaction: BaseTransaction =
            this.property.transaction ||
            (this.repository instanceof MongoRepository
                ? this.mongoTransaction
                : this.repository instanceof SqlRepository
                  ? this.sqlTransaction
                  : null);
        this.property.importService =
            this.property.importService ||
            new BaseImportService(this.repository, {
                transaction,
                useTransactionInsert: this.property.useTransactionInsert,
                useSavepoint: this.property.useSavepoint,
                concurentInsert: this.property.concurentInsert,
                exportDefinitionMaxLevel: this.getExportDefinitionMaxLevel(),
                transformErrorMessage: this.transformErrorMessage,
                transformEntityLabel: this.transformEntityLabel,
                settingService: this.biSettingService,
            });

        this.property.transaction = transaction;
    }

    constructor(
        private readonly repository: R,
        private readonly property: {
            notFoundCode?: ErrorCode;
            transaction?: BaseTransaction;
            importService?: BaseImportService<E, R>;
            useTransactionInsert?: boolean;
            useSavepoint?: boolean;
            concurentInsert?: number;
            upsertKeys?: Array<keyof E>;
            exportDefinitionMaxLevel?: number;
        } = {},
    ) {}

    getImportService(): BaseImportService<E, R> {
        return this.property.importService;
    }

    getRepository(): R {
        return this.repository;
    }

    private getTransactionManager(): BaseTransaction | undefined {
        return this.property.transaction;
    }

    protected getExportDefinitionMaxLevel(): number {
        return this.property.exportDefinitionMaxLevel ?? 3;
    }

    async create(
        user: User,
        dto: Partial<E>,
        options?: CreateQuery<E> & BaseQueryOption<unknown>,
    ) {
        options = options || {};
        const internalTransaction = !Boolean(options.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            options.transaction = await transactionManager?.startTransaction();
        }
        try {
            const res = await this.repository.create(
                dto as CreateDocument<E>,
                options,
            );
            if (internalTransaction) {
                await transactionManager?.commitTransaction(
                    options.transaction,
                );
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(options.transaction);
            }
            throw err;
        }
    }

    async insertMany(
        user: User,
        list: CreateDocument<E>[],
        options?: BaseQueryOption<unknown>,
    ) {
        options = options || {};
        const internalTransaction = !Boolean(options.transaction);
        if (internalTransaction) {
            options.transaction =
                await this.getTransactionManager()?.startTransaction();
        }
        const { transaction } = options;
        const transactionManager = this.getTransactionManager();
        try {
            const res = await this.repository.insertMany(list, options);
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async getById(
        user: User,
        id: string,
        query?: GetByIdQuery<E> & BaseQueryOption<unknown>,
    ) {
        const res = await this.repository.getById(id, query);
        if (!res && this.property.notFoundCode) {
            throw ApiError.NotFound(this.property.notFoundCode);
        }
        return res;
    }

    async getOne(
        user: User,
        conditions: QueryCondition<E>,
        query?: GetOneQuery<E> & BaseQueryOption<unknown>,
    ) {
        const res = await this.repository.getOne(conditions, query);
        if (!res && this.property.notFoundCode) {
            throw ApiError.NotFound(this.property.notFoundCode);
        }
        return res;
    }

    getMany(
        user: User,
        conditions: QueryCondition<E>,
        query?: GetManyQuery<E> & BaseQueryOption<unknown>,
    ) {
        return this.repository.getMany(conditions, query);
    }

    getPage(
        user: User,
        conditions: QueryCondition<E>,
        query?: GetPageQuery<E> & BaseQueryOption<unknown>,
    ) {
        return this.repository.getPage(conditions, query);
    }

    async updateById(
        user: User,
        id: string,
        update: UpdateDocument<E>,
        query?: UpdateByIdQuery & BaseQueryOption<unknown>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.updateById(id, update, query);
            if (!res && this.property.notFoundCode) {
                throw ApiError.NotFound(this.property.notFoundCode);
            }
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async getOneOrUpsert(user: User, dto: UpdateDocument<E>) {
        if (!this.property.upsertKeys) {
            throw new BadRequestException("Upsert keys are missing");
        }
        const transactionManager = this.getTransactionManager();
        const transaction = await transactionManager?.startTransaction();
        try {
            const condition = _.pick(
                dto as QueryCondition<E>,
                ...this.property.upsertKeys,
            );
            let res = await this.repository.getOne(condition, { transaction });
            res ??= await this.repository.create(dto as CreateDocument<E>, {
                transaction,
            });
            if (transaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (transaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async upsert(user: User, dto: UpdateDocument<E>) {
        if (!this.property.upsertKeys) {
            throw new BadRequestException("Upsert keys are missing");
        }
        const condition = _.pick(
            dto as QueryCondition<E>,
            ...this.property.upsertKeys,
        );
        const update = _.omit(dto, ...this.property.upsertKeys);
        return this.repository.updateOne(condition, update, { upsert: true });
    }

    async updateOne(
        user: User,
        conditions: QueryCondition<E>,
        update: UpdateDocument<E>,
        query?: UpdateOneQuery<E> & BaseQueryOption<unknown>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.updateOne(
                conditions,
                update,
                query,
            );
            if (!res && this.property.notFoundCode) {
                throw ApiError.NotFound(this.property.notFoundCode);
            }
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async updateMany(
        user: User,
        conditions: QueryCondition<E>,
        update: UpdateDocument<E>,
        query?: UpdateManyQuery<E> & BaseQueryOption<unknown>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.updateMany(
                conditions,
                update,
                query,
            );
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async updateManyByIds(
        user: User,
        dto: { ids: string[]; update: UpdateDocument<E> },
        query?: UpdateManyQuery<E>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.updateMany(
                { _id: { $in: dto.ids } },
                dto.update,
                query,
            );
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async deleteById(user: User, id: string, query?: BaseQueryOption<unknown>) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.deleteById(id, query);
            if (!res && this.property.notFoundCode) {
                throw ApiError.NotFound(this.property.notFoundCode);
            }
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async deleteManyByIds(
        user: User,
        dto: DeleteManyByIdsDto,
        query?: DeleteManyQuery<E>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.deleteMany(
                { _id: { $in: dto.ids } },
                query,
            );
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async deleteOne(
        user: User,
        conditions: QueryCondition<E>,
        query?: DeleteOneQuery<E>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.deleteOne(conditions, query);
            if (!res && this.property.notFoundCode) {
                throw ApiError.NotFound(this.property.notFoundCode);
            }
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }

    async deleteMany(
        user: User,
        conditions: QueryCondition<E>,
        query: BaseQueryOption<unknown>,
    ) {
        query = query || {};
        const internalTransaction = !Boolean(query.transaction);
        const transactionManager = this.getTransactionManager();
        if (internalTransaction) {
            query.transaction = await transactionManager?.startTransaction();
        }
        const { transaction } = query;
        try {
            const res = await this.repository.deleteMany(conditions, query);
            if (internalTransaction) {
                await transactionManager?.commitTransaction(transaction);
            }
            return res;
        } catch (err) {
            if (internalTransaction) {
                await transactionManager?.abortTransaction(transaction);
            }
            throw err;
        }
    }
}
