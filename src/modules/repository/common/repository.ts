import { DpConfig } from "@module/data-partition/common/type";
import { Inject, Logger, Provider, Type } from "@nestjs/common";
import { EntityValue } from "..";
import { BaseRepository } from "./base-repository.interface";

const logger = new Logger("Repository");

export const RepositoryProviderName = (name: EntityValue) =>
    `${name}BaseRepository`;
export const RepositoryProvider = (
    name: EntityValue,
    repository: Type<any>,
): Provider => {
    return { provide: RepositoryProviderName(name), useClass: repository };
};
// export const RepositoryProvider = (
//     name: EntityValue,
//     repository: Type<any>,
//     options?: {
//         dpConfig?: DpConfig;
//     },
// ): Provider => {
//     return {
//         provide: RepositoryProviderName(name),
//         useFactory: async (
//             // sequelizeService: SequelizeService,
//             model: any,
//             cps: CommonProviderService,
//         ) => {
//             let res: BaseRepository<BaseEntity>;
//             if (repository.prototype instanceof MongoRepository) {
//                 res = new repository(model);
//             }
//             // if (repository.prototype instanceof SqlRepository) {
//             //     res = new repository(sequelizeService?.getModelEntity(name));
//             // }
//             if (res) {
//                 res.setEntity(name);
//                 res.setDpConfig(options?.dpConfig || {});
//                 res.cps = cps;
//             }
//             return res;
//         },
//         inject: [repository],
//     };
// };
export const InjectRepository = (name: EntityValue) =>
    Inject(RepositoryProviderName(name));

export const RepositoryConfig = (
    options: Partial<Record<EntityValue, { dpConfig?: DpConfig }>>,
): Provider => ({
    provide: "REPOSITORY_CONFIG",
    useFactory: (...repositories: BaseRepository[]) => {
        const repositoryEntries = Object.entries(options);
        repositories.forEach((repository, index) => {
            const entries = repositoryEntries[index];
            logger.verbose(`Config repository: ${entries[0]}`);
            repository.setEntity(entries[0] as EntityValue);
            repository.setDpConfig(entries[1]?.dpConfig || {});
        });
    },
    inject: [
        ...Object.keys(options).map((entity: EntityValue) =>
            RepositoryProviderName(entity),
        ),
    ],
});
