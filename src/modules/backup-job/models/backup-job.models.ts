import { BackupJobEntity } from "../entities/backup-job.entity";
import {
    Column,
    Table,
    Model,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import { Entity } from "@module/repository";
import { StrObjectId } from "@common/constant";
import { DatabaseConfigModel } from "@module/database-config/models/databaseconfig.models";

@Table({ tableName: Entity.BACKUP_JOB })
export class BackupjobModel extends Model implements BackupJobEntity {
    @StrObjectId()
    _id: string;

    @ForeignKey(() => DatabaseConfigModel)
    @Column
    databaseConfigId: string;

    @BelongsTo(() => DatabaseConfigModel)
    databaseConfig: DatabaseConfigModel;

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
