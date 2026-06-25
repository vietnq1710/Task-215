import { Module } from "@nestjs/common";
import { Entity } from "@module/repository";
import {
    RepositoryConfig,
    RepositoryProvider,
} from "@module/repository/common/repository";
import { SequelizeModule } from "@nestjs/sequelize";
import { BackupjobModel } from "./models/backup-job.models";
import { BackupjobService } from "./services/backup-job.service";
import { BackupjobController } from "./controllers/backup-job.controller";
import { BackupjobSqlRepository } from "./repositories/backupjob-sql-repository";
import { BackupSchedulerService } from "./services/backup-scheduler.service";
import { RetentionService } from "./services/retiention.service";
import { BackuphistoryModule } from "@module/backup-history/backup-history.module";
import { BackupService } from "./services/backup.service";
import { BackupHistoryModel } from "@module/backup-history/models/backup-history.models";

@Module({
    imports: [
        SequelizeModule.forFeature([BackupjobModel, BackupHistoryModel]),
        BackuphistoryModule,
    ],

    controllers: [BackupjobController],

    providers: [
        BackupjobService,
        BackupSchedulerService,
        RetentionService,
        BackupService,
        RepositoryProvider(Entity.BACKUP_JOB, BackupjobSqlRepository),

        RepositoryConfig({
            [Entity.BACKUP_JOB]: {
                dpConfig: {
                    disable: true,
                },
            },
        }),
    ],

    exports: [BackupjobService, BackupSchedulerService, RetentionService],
})
export class BackupjobModule {}
