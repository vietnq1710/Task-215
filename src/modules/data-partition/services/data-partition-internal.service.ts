import { CommonClsState } from "@common/interface/common-cls-state";
import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";

@Injectable()
export class DataPartitionInternalService {
    constructor(private readonly clsService: ClsService<CommonClsState>) {}

    getClsDataPartition() {
        return this.clsService.get("dataPartition");
    }

    getClsDPSubtree() {
        return this.clsService.get("dpSubtree");
    }
    getClsDPRootPath() {
        return this.clsService.get("dpRootPath");
    }

    getQueryMode() {
        return this.clsService.get("dataPartitionQueryScope");
    }

    isEnabled() {
        return this.clsService.get("enableDataPartition");
    }
}
