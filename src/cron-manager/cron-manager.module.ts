import { Global, Module } from "@nestjs/common";
import { CronManagerService } from "./cron-manager.service";

@Global()
@Module({
    providers: [CronManagerService],
    exports: [CronManagerService],
})
export class CronManagerModule {}
