import { Module } from "@nestjs/common";
import { DatabaseconfigController } from "./controllers/database-config.controller";
import { DatabaseconfigService } from "./services/database-config.service";

@Module({
    controllers: [DatabaseconfigController],
    providers: [DatabaseconfigService],
    exports: [DatabaseconfigService],
})
export class DatabaseconfigModule {}
