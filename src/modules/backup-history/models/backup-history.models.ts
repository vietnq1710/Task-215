import { Table, Model, Column } from "sequelize-typescript";
import { Entity } from "@module/repository";
import { BackupHistoryEntity } from "../entities/backup-history.entity";
import { StrObjectId } from "@common/constant";
import { Status } from "@common/constant";

@Table({ tableName: Entity.BACKUP_HISTORY })
export class BackupHistoryModel extends Model implements BackupHistoryEntity {
    @StrObjectId()
    _id: string;

    @Column({
        allowNull: false,
    })
    BackupJobId: string;

    @Column({
        allowNull: false,
    })
    fileName: string;

    @Column({
        allowNull: false,
    })
    filePath: string;

    @Column({
        allowNull: false,
        type: "enum",
        values: Object.values(Status),
    })
    status: Status;

    @Column({
        allowNull: false,
        type: "date",
    })
    startTime: Date;

    @Column({
        allowNull: false,
        type: "date",
    })
    endTime: Date;

    @Column({
        allowNull: false,
        type: "json",
    })
    log: {
        stdout: string;
        stderr: string;
    };
}
