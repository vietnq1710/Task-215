import { BaseControllerFactory } from "@config/controller/base-controller-factory";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BackupJobEntity } from "../entities/backup-job.entity";
import { CreateBackupjobDto } from "../dtos/create-backupjob.dto";
import { UpdateBackupjobDto } from "../dtos/update-backupjob.dto";
import { BackupjobService } from "../services/backup-job.service";

@Controller("backup-job")
@ApiTags("backup-job")
export class BackupjobController extends BaseControllerFactory<BackupJobEntity>(
    BackupJobEntity,
    CreateBackupjobDto,
    UpdateBackupjobDto,
    null,
) {
    constructor(private readonly service: BackupjobService) {
        super(service);
    }
}
