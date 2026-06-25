import { BaseControllerFactory } from "@config/controller/base-controller-factory";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BackupHistoryEntity } from "../entities/backup-history.entity";
import { CreateBackupjobDto } from "@module/backup-job/dtos/create-backupjob.dto";
import { UpdateBackupjobDto } from "@module/backup-job/dtos/update-backupjob.dto";
import { BackuphistoryService } from "../services/backup-history.service";

@Controller("backup-history")
@ApiTags("backup-history")
export class BackuphistoryController extends BaseControllerFactory<BackupHistoryEntity>(
    BackupHistoryEntity,
    CreateBackupjobDto,
    UpdateBackupjobDto,
    null,
) {
    constructor(private readonly service: BackuphistoryService) {
        super(service);
    }
}
