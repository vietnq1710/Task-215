import { StrObjectId } from "@common/constant";
import { BaseEntity } from "@common/interface/base-entity.interface";

export class BackupJobEntity implements BaseEntity {
    @StrObjectId()
    _id: string;

    databaseconfigId: string;

    cronExpression: string;

    retentionDays: number;

    isActive: boolean;
}
