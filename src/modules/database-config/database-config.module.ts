import { Module } from "@nestjs/common";
import { DatabaseconfigController } from "./controllers/database-config.controller";
import { DatabaseconfigService } from "./services/database-config.service";
import { DatabaseconfigSqlRepository } from "./repositories/databaseconfig-sql-repository";
import { Entity } from "@module/repository";
import {
    RepositoryConfig,
    RepositoryProvider,
} from "@module/repository/common/repository";
import { SequelizeModule } from "@nestjs/sequelize";
import { DatabaseConfigModel } from "./models/databaseconfig.models";

@Module({
    imports: [SequelizeModule.forFeature([DatabaseConfigModel])],

    controllers: [DatabaseconfigController],

    providers: [
        DatabaseconfigService,

        RepositoryProvider(Entity.DATABASE_CONFIG, DatabaseconfigSqlRepository),

        RepositoryConfig({
            [Entity.DATABASE_CONFIG]: {
                dpConfig: {
                    disable: true,
                },
            },
        }),
    ],

    exports: [DatabaseconfigService],
})
export class DatabaseconfigModule {}
