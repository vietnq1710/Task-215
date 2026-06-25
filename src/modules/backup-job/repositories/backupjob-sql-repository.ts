import { SqlRepository } from "@module/repository/sequelize/sql.repository";
import { BackupJobEntity } from "../entities/backup-job.entity";
import { BackupjobRepository } from "./backupjob-repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { BackupjobModel } from "../models/backup-job.models";
import { ModelCtor } from "sequelize-typescript";

export class BackupjobSqlRepository
    extends SqlRepository<BackupJobEntity>
    implements BackupjobRepository
{
    constructor(
        @InjectModel(BackupjobModel)
        private readonly backupJobModel: ModelCtor<BackupjobModel>,
    ) {
        super(backupJobModel);
    }
}
