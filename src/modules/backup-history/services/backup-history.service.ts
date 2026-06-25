import { BaseService } from "@config/service/base.service";
import { BackupHistoryEntity } from "../entities/backup-history.entity";
import { BackuphistorySqlRepository } from "../repositories/backuphistory-sql-repository";
import { InjectRepository } from "@module/repository/common/repository";
import { Entity } from "@module/repository";

export class BackuphistoryService extends BaseService<
    BackupHistoryEntity,
    BackuphistorySqlRepository
> {
    constructor(
        @InjectRepository(Entity.BACKUP_HISTORY)
        private readonly Repo: BackuphistorySqlRepository,
    ) {
        super(Repo);
    }

    async createHistory(jobId: string, backupResult: any) {
        return this.Repo.create({
            BackupJobId: backupResult.BacupJobId,
            fileName: backupResult.fileName,
            filePath: backupResult.filePath,
            status: backupResult.result.status,
            startTime: backupResult.result.startTime,
            endTime: backupResult.result.endTime,
            log: {
                stdout: backupResult.result.stdout ?? "",
                stderr: backupResult.result.stderr ?? "",
            },
        });
    }
}
