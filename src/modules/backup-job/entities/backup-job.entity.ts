import { StrObjectId } from "@common/constant";
import { BaseEntity } from "@common/interface/base-entity.interface";
import { DatabaseConfigEntity } from "@module/database-config/entities/database-config.entity";

export class BackupJobEntity implements BaseEntity {
    @StrObjectId()
    _id: string;

    databaseConfigId: string;

    databaseConfig?: DatabaseConfigEntity;

    cronExpression: string;

    retentionDays: number;

    isActive: boolean;
}
