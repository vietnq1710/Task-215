import { BackuphistoryRepository } from "@module/backup-history/repositories/backuphistory-repository.interface";
import { Entity } from "@module/repository";
import { InjectRepository } from "@module/repository/common/repository";
import { Injectable } from "@nestjs/common";
import { BackupjobRepository } from "../repositories/backupjob-repository.interface";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as fs from "fs";
@Injectable()
export class RetentionService {
    constructor(
        @InjectRepository(Entity.BACKUP_HISTORY)
        private readonly backupHistoryRepo: BackuphistoryRepository,

        @InjectRepository(Entity.BACKUP_JOB)
        private readonly backupJobRepo: BackupjobRepository,
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async cleanupExpiredBackups() {
        console.log("Retention cleanup start: ");
        const histories = await this.backupHistoryRepo.getMany({});
        const jobMap = await this.backupJobRepo.getMap(["_id"], {});
        console.log(`Found ${histories.length} histories`);
        const now = new Date();
        for (const history of histories) {
            const job = jobMap[history.BackupJobId];
            if (!job) {
                console.log(`History ${history._id} has no backup job`);
                continue;
            }
            const retentionDays = job.retentionDays;
            const expiredAt = new Date(history.endTime);

            expiredAt.setMinutes(expiredAt.getMinutes() + retentionDays);
            // expiredAt.setDate(expiredAt.getDate() + retentionDays);
            if (expiredAt <= now) {
                try {
                    if (history.filePath && fs.existsSync(history.filePath)) {
                        const stat = fs.statSync(history.filePath);
                        if (stat.isDirectory()) {
                            fs.rmSync(history.filePath, {
                                recursive: true,
                                force: true,
                            });
                        } else {
                            fs.unlinkSync(history.filePath);
                        }
                        console.log(`Deleted file ${history.fileName}`);
                    }
                    await this.backupHistoryRepo.deleteById(history._id);
                    console.log(`Deleted history ${history._id}`);
                } catch (error) {
                    console.error(
                        `Cleanup failed for history ${history._id}`,
                        error,
                    );
                }
            }
        }
    }
}
