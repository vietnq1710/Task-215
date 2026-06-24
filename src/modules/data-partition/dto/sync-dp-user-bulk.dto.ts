import { Type } from "class-transformer";
import {
    IsBoolean,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";
import { SyncDpUserDto } from "./sync-dp-user.dto";

export class SyncDpUserBulkDto {
    @IsString()
    syncGroup: string;

    @IsBoolean()
    @IsOptional()
    fullSync?: boolean;

    @Type(() => SyncDpUserDto)
    @ValidateNested({ each: true })
    bulk: SyncDpUserDto[];
}
