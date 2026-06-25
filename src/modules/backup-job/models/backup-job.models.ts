import { BackupJobEntity } from "../entities/backup-job.entity";
import { Column, Table, Model } from "sequelize-typescript";
import { Entity } from "@module/repository";
import { StrObjectId } from "@common/constant";
@Table({ tableName: Entity.BACKUP_JOB })
export class BackupjobModel extends Model implements BackupJobEntity {
    @StrObjectId()
    _id: string;

    @Column({
        allowNull: false,
    })
    databaseconfigId: string;

    @Column({
        allowNull: false,
    })
    cronExpression: string;

    @Column({
        allowNull: false,
    })
    retentionDays: number;

    @Column({
        defaultValue: true,
    })
    isActive: boolean;
}
