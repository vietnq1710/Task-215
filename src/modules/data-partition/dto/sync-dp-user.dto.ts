import { PickType } from "@nestjs/swagger";
import { DataPartitionUser } from "../entities/data-partition-user.entity";

export class SyncDpUserDto extends PickType(DataPartitionUser, [
    "dataPartitionCode",
    "userId",
    "userCode",
    "userEmail",
    "userFullname",
]) {}
