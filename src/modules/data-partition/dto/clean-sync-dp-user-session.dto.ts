import { IsString } from "class-validator";

export class CleanSyncDpUserSessionDto {
    @IsString()
    syncSessionId: string;
}
