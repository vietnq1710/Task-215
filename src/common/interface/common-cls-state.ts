import { DPQueryScope } from "@common/constant";
import { DataPartition } from "@module/data-partition/entities/data-partition.entity";
import { ClsStore } from "nestjs-cls";

export interface CommonClsState extends ClsStore {
    enableDataPartition?: boolean;
    dataPartition?: DataPartition;
    dataPartitionQueryScope?: DPQueryScope;
    dpRootPath?: DataPartition[];
    dpSubtree?: DataPartition[];
    model: "local" | "core";
}
