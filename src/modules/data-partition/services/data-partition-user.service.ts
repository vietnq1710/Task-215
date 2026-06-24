import { DPQueryScope } from "@common/constant";
import { CommonClsState } from "@common/interface/common-cls-state";
import { BaseService } from "@config/service/base.service";
import { InjectTcpClient } from "@module/microservice/tcp/tcp-client.provider";
import { Entity } from "@module/repository";
import { BaseTransaction } from "@module/repository/common/base-transaction.interface";
import { InjectRepository } from "@module/repository/common/repository";
import { InjectTransaction } from "@module/repository/common/transaction";
import { User } from "@module/user/entities/user.entity";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ClsService } from "nestjs-cls";
import { lastValueFrom } from "rxjs";
import { SyncDpUserBulkDto } from "../dto/sync-dp-user-bulk.dto";
import { DataPartitionUser } from "../entities/data-partition-user.entity";
import { DataPartition } from "../entities/data-partition.entity";
import { DataPartitionUserRepository } from "../repository/data-partition-user-repository.interface";
import { DataPartitionService } from "./data-partition.service";

@Injectable()
export class DataPartitionUserService extends BaseService<
    DataPartitionUser,
    DataPartitionUserRepository
> {
    constructor(
        @InjectRepository(Entity.DATA_PARTITION_USER)
        private readonly dataPartitionUserRepository: DataPartitionUserRepository,
        @InjectTcpClient("core")
        private readonly coreTcpClient: ClientProxy,
        private readonly dataPartitionService: DataPartitionService,
        private readonly clsService: ClsService<CommonClsState>,
        @InjectTransaction()
        private readonly transaction: BaseTransaction,
    ) {
        super(dataPartitionUserRepository);
    }

    async localGetOneDpUser(dataPartitionCode: string, userId: string) {
        const res = await this.dataPartitionUserRepository.getOne(
            {
                dataPartitionCode,
                userId,
            },
            { population: [{ path: "dataPartition" }] },
        );
        return res?.dataPartition;
    }

    async getOneDpUser(
        dataPartitionCode: string,
        userId: string,
    ): Promise<DataPartition> {
        const model = this.clsService.get("model");
        switch (model) {
            case "core": {
                const res = await lastValueFrom<DataPartitionUser>(
                    this.coreTcpClient.send("data-partition-user/get-one", {
                        conditions: { dataPartitionCode, userId },
                        query: { population: [{ path: "dataPartition" }] },
                    }),
                );
                return res?.dataPartition;
            }
            case "local":
            default: {
                return this.localGetOneDpUser(dataPartitionCode, userId);
            }
        }
    }

    async localGetOneDpUserRootPath(dataPartitionCode: string, userId: string) {
        const res = await this.dataPartitionUserRepository.getOne(
            {
                dataPartitionCode,
                userId,
            },
            { population: [{ path: "dataPartition" }] },
        );
        return this.dataPartitionService.getRootPath(res?.dataPartition);
    }

    async getOneDpUserRootPath(dataPartitionCode: string, userId: string) {
        const model = this.clsService.get("model");
        switch (model) {
            case "core": {
                const res = await lastValueFrom<DataPartition[]>(
                    this.coreTcpClient.send(
                        "data-partition-user/get-root-path",
                        { dataPartitionCode, userId },
                    ),
                );
                return res;
            }
            case "local":
            default: {
                return this.localGetOneDpUserRootPath(
                    dataPartitionCode,
                    userId,
                );
            }
        }
    }

    async localGetOneDpUserSubtree(dataPartitionCode: string, userId: string) {
        const res = await this.dataPartitionUserRepository.getOne(
            {
                dataPartitionCode,
                userId,
            },
            { population: [{ path: "dataPartition" }] },
        );
        return this.dataPartitionService.getSubtree(res?.dataPartition);
    }

    async getOneDpUserSubtree(dataPartitionCode: string, userId: string) {
        const model = this.clsService.get("model");
        switch (model) {
            case "core": {
                const res = await lastValueFrom<DataPartition[]>(
                    this.coreTcpClient.send("data-partition-user/get-subtree", {
                        dataPartitionCode,
                        userId,
                    }),
                );
                return res;
            }
            case "local":
            default: {
                return this.localGetOneDpUserSubtree(dataPartitionCode, userId);
            }
        }
    }

    async getManyMe(user: User) {
        return this.dataPartitionUserRepository.getMany(
            { userId: user.ssoId },
            { population: [{ path: "dataPartition" }] },
        );
    }

    async syncBulk(dto: SyncDpUserBulkDto) {
        if (dto.fullSync && !dto.syncGroup) {
            throw new BadRequestException("Sync Group empty");
        }
        const transaction = await this.transaction.startTransaction();
        try {
            let upsertedIds: string[];
            if (dto.fullSync) {
                upsertedIds = [];
            }
            for (const item of dto.bulk) {
                const { userId, dataPartitionCode, ...update } = item;
                const upserted =
                    await this.dataPartitionUserRepository.updateOne(
                        {
                            userId,
                            dataPartitionCode,
                        },
                        { ...update, syncGroup: dto.syncGroup },
                        { upsert: true, transaction },
                    );
                if (dto.fullSync) {
                    upsertedIds.push(upserted._id);
                }
            }
            if (dto.fullSync) {
                await this.dataPartitionUserRepository.deleteMany({
                    syncGroup: dto.syncGroup,
                    _id: { $nin: upsertedIds },
                });
            }
            await this.transaction.commitTransaction(transaction);
        } catch (err) {
            await this.transaction.abortTransaction(transaction);
            throw err;
        }
    }

    async getDpUserByMode(
        dataPartitionCode: string,
        userId: string,
        mode: DPQueryScope,
    ) {
        const model = this.clsService.get("model");
        switch (model) {
            case "core": {
                const res = await lastValueFrom<DataPartition[]>(
                    this.coreTcpClient.send("data-partition-user/many", {
                        ssoId: userId,
                        dataPartitionCode,
                        mode,
                    }),
                );
                return res;
            }
            case "local":
            default: {
                let danhSachDataPartition: DataPartition[] = [];
                const res = await this.dataPartitionUserRepository.getOne(
                    {
                        dataPartitionCode,
                        userId,
                    },
                    { population: [{ path: "dataPartition" }] },
                );
                switch (mode) {
                    case DPQueryScope.ROOT_PATH: {
                        danhSachDataPartition =
                            await this.dataPartitionService.getRootPath(
                                res?.dataPartition,
                            );
                        break;
                    }
                    case DPQueryScope.SUBTREE: {
                        danhSachDataPartition =
                            await this.dataPartitionService.getSubtree(
                                res?.dataPartition,
                            );
                        break;
                    }
                    case DPQueryScope.NODE: {
                        danhSachDataPartition = [res?.dataPartition];
                        break;
                    }
                }
                return this.dataPartitionUserRepository.getMany({
                    dataPartitionCode: {
                        $in: danhSachDataPartition.map((e) => e.ma),
                    },
                });
            }
        }
    }
}
