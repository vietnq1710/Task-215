import { BaseService } from "@config/service/base.service";
import { BackupJobEntity } from "../entities/backup-job.entity";
import { BackupjobSqlRepository } from "../repositories/backupjob-sql-repository";
import { InjectRepository } from "@module/repository/common/repository";
import { Entity } from "@module/repository";

export class BackupjobService extends BaseService<
    BackupJobEntity,
    BackupjobSqlRepository
> {
    constructor(
        @InjectRepository(Entity.BACKUP_JOB)
        private readonly Repo: BackupjobSqlRepository,
    ) {
        super(Repo);
    }
}
