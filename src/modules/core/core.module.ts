import { Global, Module } from "@nestjs/common";
import { CoreInternalService } from "./core-internal.service";

@Global()
@Module({ providers: [CoreInternalService], exports: [CoreInternalService] })
export class CoreModule {}
