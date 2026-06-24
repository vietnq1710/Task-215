import { Configuration } from "@config/configuration";
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class GwGuard implements CanActivate {
    constructor(private readonly configService: ConfigService<Configuration>) {}

    canActivate(context: ExecutionContext): boolean {
        const requestType = context.getType();
        const { gwApiKey } = this.configService.get("server", {
            infer: true,
        });

        if (!gwApiKey) {
            throw new UnauthorizedException(
                "Gateway API key is not configured",
            );
        }

        if (requestType === "http") {
            const request = context.switchToHttp().getRequest<Request>();
            const apiKey = request.headers["x-gw-api-key"] as string;
            return apiKey === gwApiKey;
        }

        if (requestType === "rpc") {
            const data = context.switchToRpc().getData();
            return data?.auth?.apiKey === gwApiKey;
        }

        return false;
    }
}
