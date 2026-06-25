import { BaseRepository } from "@module/repository/common/base-repository.interface";
import { BackupJobEntity } from "../entities/backup-job.entity";

export interface BackupjobRepository extends BaseRepository<BackupJobEntity> {}
