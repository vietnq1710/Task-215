import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { InternalAuthHttpService } from "./internal-auth-http.service";
import { InternalHttpService } from "./internal-http.service";

@Global()
@Module({
    imports: [HttpModule.register({ maxRedirects: 0 })],
    providers: [InternalHttpService, InternalAuthHttpService],
    exports: [InternalHttpService, InternalAuthHttpService],
})
export class InternalHttpModule {}
