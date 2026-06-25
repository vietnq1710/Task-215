import { Module } from "@nestjs/common";
import { Entity } from "@module/repository";
import {
    RepositoryConfig,
    RepositoryProvider,
} from "@module/repository/common/repository";
import { SequelizeModule } from "@nestjs/sequelize";
import { BackupHistoryModel } from "./models/backup-history.models";
import { BackuphistoryController } from "./controllers/backup-history.controller";
import { BackuphistoryService } from "./services/backup-history.service";
import { BackuphistorySqlRepository } from "./repositories/backuphistory-sql-repository";

@Module({
    imports: [SequelizeModule.forFeature([BackupHistoryModel])],

    controllers: [BackuphistoryController],

    providers: [
        BackuphistoryService,

        RepositoryProvider(Entity.BACKUP_HISTORY, BackuphistorySqlRepository),

        RepositoryConfig({
            [Entity.BACKUP_HISTORY]: {
                dpConfig: {
                    disable: true,
                },
            },
        }),
    ],

    exports: [
        BackuphistoryService,
        RepositoryProvider(Entity.BACKUP_HISTORY, BackuphistorySqlRepository),
    ],
})
export class BackuphistoryModule {}
