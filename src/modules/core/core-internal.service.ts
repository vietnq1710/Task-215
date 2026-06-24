import { DataPartition } from "@module/data-partition/entities/data-partition.entity";
import { InjectTcpClient } from "@module/microservice/tcp/tcp-client.provider";
import { Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";

@Injectable()
export class CoreInternalService {
    constructor(
        @InjectTcpClient("core")
        private readonly coreTcpClient: ClientProxy,
    ) {}

    async getDpRootPath(dataPartitionCode: string) {
        const res = await lastValueFrom<DataPartition[]>(
            this.coreTcpClient.send("data-partition/get-root-path", {
                dataPartitionCode,
            }),
        );
        return res;
    }

    async getDpSubtree(dataPartitionCode: string) {
        const res = await lastValueFrom<DataPartition[]>(
            this.coreTcpClient.send("data-partition/get-subtree", {
                dataPartitionCode,
            }),
        );
        return res;
    }
}
