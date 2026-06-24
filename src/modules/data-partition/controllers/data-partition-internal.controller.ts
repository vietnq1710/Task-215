import { GetOneQuery, GetPageQuery } from "@common/constant";
import { InternalController } from "@common/decorator/route.decorator";
import { QueryCondition } from "@module/repository/common/base-repository.interface";
import { Post } from "@nestjs/common";
import { MessagePattern, Transport } from "@nestjs/microservices";
import { DataPartitionUser } from "../entities/data-partition-user.entity";
import { DataPartition } from "../entities/data-partition.entity";
import { DataPartitionUserService } from "../services/data-partition-user.service";
import { DataPartitionService } from "../services/data-partition.service";

@InternalController("data-partition")
export class DataPartitionInternalController {
    constructor(
        private readonly dataPartitionUserService: DataPartitionUserService,
        private readonly dataPartitionService: DataPartitionService,
    ) {}

    @Post("test")
    async test() {
        return "Hello world";
    }

    @MessagePattern("data-partition-user/get-one", Transport.TCP)
    async getMe(data: {
        conditions: QueryCondition<DataPartitionUser>;
        query: GetOneQuery<DataPartitionUser>;
    }) {
        const { conditions, query } = data;
        return this.dataPartitionUserService.getOne(null, conditions, query);
    }

    @MessagePattern("data-partition-user/get-root-path", Transport.TCP)
    async getRootPath(data: { userId: string; dataPartitionCode: string }) {
        const { dataPartitionCode, userId } = data;
        return this.dataPartitionUserService.localGetOneDpUserRootPath(
            dataPartitionCode,
            userId,
        );
    }

    @MessagePattern("data-partition-user/get-subtree", Transport.TCP)
    async getSubtree(data: { userId: string; dataPartitionCode: string }) {
        const { dataPartitionCode, userId } = data;
        return this.dataPartitionUserService.localGetOneDpUserSubtree(
            dataPartitionCode,
            userId,
        );
    }

    @MessagePattern("data-partition/page", Transport.TCP)
    async getPage(data: {
        conditions: QueryCondition<DataPartition>;
        query: GetPageQuery<DataPartition>;
    }) {
        const { conditions, query } = data;
        return this.dataPartitionService.getPage(null, conditions, query);
    }

    @MessagePattern("data-partition/get-root-path", Transport.TCP)
    async getDpRootPath(data: { dataPartitionCode: string }) {
        const { dataPartitionCode } = data;
        return this.dataPartitionService.localGetOneDpRootPath(
            dataPartitionCode,
        );
    }

    @MessagePattern("data-partition/get-subtree", Transport.TCP)
    async getDpSubtree(data: { dataPartitionCode: string }) {
        const { dataPartitionCode } = data;
        return this.dataPartitionService.localGetOneDpSubtree(
            dataPartitionCode,
        );
    }
}
