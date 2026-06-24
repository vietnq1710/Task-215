import { DpConfig } from "@module/data-partition/common/type";
import { DataPartitionInternalService } from "@module/data-partition/services/data-partition-internal.service";
import { Injectable } from "@nestjs/common";
@Injectable()
export class CommonProviderService {
    constructor(public readonly dpiService: DataPartitionInternalService) {}

    isDpEnable(dpConfig: DpConfig) {
        // If disable = true then enable = false
        // Otherwise we can not decide whether enable should be true or false
        const enable = dpConfig?.disable === true ? false : undefined;
        return enable ?? this.dpiService.isEnabled();
    }
}
