import { InternalController } from "@common/decorator/route.decorator";
import { Body, Post } from "@nestjs/common";
import { SyncDpUserBulkDto } from "../dto/sync-dp-user-bulk.dto";
import { DataPartitionUserService } from "../services/data-partition-user.service";
import { DPQueryScope } from "@common/constant";
import { MessagePattern } from "@nestjs/microservices";

@InternalController("data-partition-user")
export class DataPartitionUserInternalController {
    constructor(
        private readonly dataPartitionUserService: DataPartitionUserService,
    ) {}

    @Post("sync/bulk")
    async syncBulk(@Body() dto: SyncDpUserBulkDto) {
        return this.dataPartitionUserService.syncBulk(dto);
    }

    @MessagePattern("data-partition-user/many/user")
    async getDpUserByMode(data: {
        ssoId: string;
        dataPatitionCode: string;
        mode: DPQueryScope;
    }) {
        const { ssoId, dataPatitionCode, mode } = data;
        return this.dataPartitionUserService.getDpUserByMode(
            dataPatitionCode,
            ssoId,
            mode,
        );
    }
}
