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

@Module({
    imports: [SequelizeModule.forFeature([BackupjobModel])],

    controllers: [BackupjobController],

    providers: [
        BackupjobService,

        RepositoryProvider(Entity.BACKUP_JOB, BackupjobSqlRepository),

        RepositoryConfig({
            [Entity.BACKUP_JOB]: {
                dpConfig: {
                    disable: true,
                },
            },
        }),
    ],

    exports: [BackupjobService],
})
export class BackupjobModule {}
