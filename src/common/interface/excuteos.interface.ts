import { Status } from "../constant/constant";

export interface ExcuteResult {
    status: Status;
    stdout: string;
    stderr: string;
    startTime: Date;
    endTime: Date;
    command: string;
}
