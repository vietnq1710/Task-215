import { Status, StrObjectId } from "@common/constant";
import { BaseEntity } from "@common/interface/base-entity.interface";

export class BackupHistoryEntity implements BaseEntity {
    @StrObjectId()
    _id: string;

    BackupJobId: string;

    fileName: string;

    filePath: string;

    status: Status;

    startTime: Date;

    endTime: Date;

    log: {
        stdout: string;
        stderr: string;
    };
}
