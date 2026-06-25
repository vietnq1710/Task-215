import { Configuration, Environment } from "@config/configuration";
import { InjectRedisClient } from "@module/redis/redis-client.provider";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from "@nestjs/sequelize";
import Redis from "ioredis";
import { ClsService } from "nestjs-cls";
import { Dialect } from "sequelize";
import { DataType } from "sequelize-typescript";
import { SequelizeModel } from "./common/sequelize-model";

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
    constructor(
        private readonly configService: ConfigService<Configuration>,
        @InjectRedisClient()
        private readonly redis: Redis,
        private readonly cls: ClsService,
    ) {}
    async createSequelizeOptions(): Promise<SequelizeModuleOptions> {
        const {
            type,
            host,
            port,
            username,
            password,
            schema,
            database,
            maxPool,
            useSSL,
            rejectUnauthorized,
            tlsCAFile,
            defaultSoftDelete,
        } = this.configService.get("sql", { infer: true });
        const environment = this.configService.get("server.env", {
            infer: true,
        });
        const timezone = this.configService.get("server.timezone", {
            infer: true,
        });
        const isLeader = await this.redis
            .set("server_leader", "1", "EX", 16, "NX")
            .then((res) => Boolean(res));
        return {
            dialect: type as Dialect,
            host,
            port,
            username,
            password,
            schema,
            database,
            models: SequelizeModel,
            pool: {
                max: maxPool,
            },
            autoLoadModels: true,
            logging: environment !== Environment.PRODUCTION,
            synchronize: environment !== Environment.PRODUCTION && isLeader,
            sync: {
                alter: true,
            },
            define: {
                paranoid: defaultSoftDelete,
                hooks: {
                    // beforeCreate: (instance: Model<BaseEntity, BaseEntity>) => {
                    //     const typedInstance = instance as unknown as BaseEntity;
                    //     const userPayload =
                    //         this.cls.get<AccessSsoJwtPayload>("userPayload");
                    //     typedInstance.createdById = userPayload?.sub;
                    //     typedInstance.createdByUsername = userPayload?.username;
                    // },
                    // beforeUpdate: (instance: Model<BaseEntity, BaseEntity>) => {
                    //     const typedInstance = instance as unknown as BaseEntity;
                    //     const userPayload =
                    //         this.cls.get<AccessSsoJwtPayload>("userPayload");
                    //     typedInstance.updatedById = userPayload?.sub;
                    //     typedInstance.updatedByUsername = userPayload?.username;
                    // },
                    // beforeDestroy: async (
                    //     instance: Model<BaseEntity, BaseEntity>,
                    // ) => {
                    //     const typedInstance = instance as unknown as BaseEntity;
                    //     const userPayload =
                    //         this.cls.get<AccessSsoJwtPayload>("userPayload");
                    //     typedInstance.deletedById = userPayload?.sub;
                    //     typedInstance.deletedByUsername = userPayload?.username;
                    // },
                    // beforeBulkCreate: (
                    //     instances: Model<BaseEntity, BaseEntity>[],
                    // ) => {
                    //     const userPayload =
                    //         this.cls.get<AccessSsoJwtPayload>("userPayload");
                    //     if (userPayload) {
                    //         instances.forEach((instance) => {
                    //             const typedInstance =
                    //                 instance as unknown as BaseEntity;
                    //             typedInstance.createdById = userPayload?.sub;
                    //             typedInstance.createdByUsername =
                    //                 userPayload?.username;
                    //         });
                    //     }
                    // },
                    // beforeBulkUpdate: (options: any) => {
                    //     const userPayload =
                    //         this.cls.get<AccessSsoJwtPayload>("userPayload");
                    //     if (userPayload) {
                    //         options.attributes = {
                    //             ...options.attributes,
                    //             updatedById: userPayload.sub,
                    //             updatedByUsername: userPayload.username,
                    //         } as Partial<BaseEntity>;
                    //         options.fields = [
                    //             ...(options.fields || []),
                    //             "updatedById",
                    //             "updatedByUsername",
                    //         ];
                    //     }
                    // },
                    // beforeBulkDestroy: (options: any) => {
                    //     const userPayload =
                    //         this.cls.get<AccessSsoJwtPayload>("userPayload");
                    //     if (userPayload) {
                    //         options.attributes = {
                    //             ...options.attributes,
                    //             deletedById: userPayload.sub,
                    //             deletedByUsername: userPayload.username,
                    //         } as Partial<BaseEntity>;
                    //         options.fields = [
                    //             ...(options.fields || []),
                    //             "deletedById",
                    //             "deletedByUsername",
                    //         ];
                    //     }
                    // },
                },
            },
            dialectOptions: {
                useUTC: false,
                ssl: useSSL
                    ? {
                          require: true,
                          rejectUnauthorized,
                          ca: tlsCAFile,
                      }
                    : undefined,
            },
            timezone,
            hooks: {
                /*
                beforeDefine: (attribute, options) => {
                    attribute.dataPartitionCode = {
                        type: DataType.STRING,
                    };
                    // attribute.createdById = {
                    //     type: DataType.STRING,
                    // };
                    // attribute.createdByUsername = {
                    //     type: DataType.STRING,
                    // };
                    // attribute.updatedById = {
                    //     type: DataType.STRING,
                    // };
                    // attribute.updatedByUsername = {
                    //     type: DataType.STRING,
                    // };
                    // attribute.deletedById = {
                    //     type: DataType.STRING,
                    // };
                    // attribute.deletedByUsername = {
                    //     type: DataType.STRING,
                    // };
                    // Object.assign(options, {
                    //     indexes: [
                    //         ...(options.indexes || []),
                    //         { fields: ["dataPartitionCode"] },
                    //     ],
                    // });
                }, */
            },
        };
    }
}
