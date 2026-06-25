import { PartialType } from "@nestjs/swagger";
import { CreateBackupjobDto } from "./create-backupjob.dto";

export class UpdateBackupjobDto extends PartialType(CreateBackupjobDto) {}
