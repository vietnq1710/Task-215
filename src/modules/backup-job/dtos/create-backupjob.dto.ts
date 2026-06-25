import { IsString, IsNumber, IsBoolean } from "class-validator";

export class CreateBackupjobDto {
    @IsString()
    databaseConfigId: string;

    @IsString()
    cronExpression: string;

    @IsNumber()
    retentionDays: number;

    @IsBoolean()
    isActive: boolean;
}
