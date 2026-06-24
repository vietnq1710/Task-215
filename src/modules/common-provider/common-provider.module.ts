import { TransformErrorMessageProvider } from "@common/provider/transform-error-message.provider";
import { TransformEntityLabelProvider } from "@common/provider/transform-entity-label.provider";
import { Global, Module } from "@nestjs/common";
import { CommonProviderService } from "./common-provider.service";

@Global()
@Module({
    providers: [
        CommonProviderService,
        TransformErrorMessageProvider,
        TransformEntityLabelProvider,
    ],
    exports: [
        CommonProviderService,
        TransformErrorMessageProvider,
        TransformEntityLabelProvider,
    ],
})
export class CommonProviderModule {}
