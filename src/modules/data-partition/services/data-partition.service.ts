import { CommonClsState } from "@common/interface/common-cls-state";
import { BaseService } from "@config/service/base.service";
import { InjectTcpClient } from "@module/microservice/tcp/tcp-client.provider";
import { Entity } from "@module/repository";
import { InjectRepository } from "@module/repository/common/repository";
import { Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ClsService } from "nestjs-cls";
import { DataPartition } from "../entities/data-partition.entity";
import { DataPartitionRepository } from "../repository/data-partition-repository.interface";

@Injectable()
export class DataPartitionService extends BaseService<
    DataPartition,
    DataPartitionRepository
> {
    constructor(
        @InjectRepository(Entity.DATA_PARTITION)
        private readonly dataPartitionRepository: DataPartitionRepository,
        @InjectTcpClient("core")
        private readonly coreTcpClient: ClientProxy,
        private readonly clsService: ClsService<CommonClsState>,
    ) {
        super(dataPartitionRepository);
    }

    async getRootPath(dataPartition: string | DataPartition) {
        if (typeof dataPartition === "string") {
            dataPartition = await this.dataPartitionRepository.getOne({
                ma: dataPartition,
            });
        }
        const res: DataPartition[] = [];
        if (dataPartition) {
            const used = new Set<string>();
            while (!used.has(dataPartition.ma)) {
                used.add(dataPartition.ma);
                res.push(dataPartition);
                if (dataPartition.parentCode) {
                    dataPartition = await this.dataPartitionRepository.getOne({
                        ma: dataPartition.parentCode,
                    });
                } else {
                    break;
                }
            }
        }
        return res;
    }

    async getSubtree(dataPartition: string | DataPartition) {
        if (typeof dataPartition === "string") {
            dataPartition = await this.dataPartitionRepository.getOne({
                ma: dataPartition,
            });
        }
        const res: DataPartition[] = [];
        if (dataPartition) {
            let children: DataPartition[] = [dataPartition];
            while (children.length > 0) {
                res.push(...children);
                const parentCodeList = children.map((item) => item.ma);
                children = await this.dataPartitionRepository.getMany({
                    parentCode: { $in: parentCodeList },
                    ma: { $nin: parentCodeList },
                });
            }
        }
        return res;
    }

    async localGetOneDpRootPath(dataPartitionCode: string) {
        const dataPartition = await this.dataPartitionRepository.getOne({
            ma: dataPartitionCode,
        });
        return this.getRootPath(dataPartition);
    }

    async localGetOneDpSubtree(dataPartitionCode: string) {
        const dataPartition = await this.dataPartitionRepository.getOne({
            ma: dataPartitionCode,
        });
        return this.getSubtree(dataPartition);
    }
}
