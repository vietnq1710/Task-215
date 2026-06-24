import { Configuration } from "@config/configuration";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Method, ResponseType } from "axios";
import { lastValueFrom } from "rxjs";
import {
    createSecureHttpAgent,
    createSecureHttpsAgent,
    HttpClientName,
    getInternalHttpClientConfig,
    getInternalHttpRequestUrl,
} from "./common/constant";

@Injectable()
export class InternalHttpService {
    protected readonly customHttpAgent = createSecureHttpAgent();
    protected readonly customHttpsAgent = createSecureHttpsAgent();

    constructor(
        protected readonly httpService: HttpService,
        protected readonly configService: ConfigService<Configuration>,
    ) {}

    protected getInternalHttpConfig() {
        return this.configService.get("internal.http", { infer: true });
    }

    private getHttpClientApiKey(client: HttpClientName) {
        const config = getInternalHttpClientConfig(
            this.getInternalHttpConfig(),
            client,
        );
        return (
            config?.apiKey ||
            this.configService.get("server.gwApiKey", { infer: true })
        );
    }

    async request(
        client: HttpClientName,
        method: Method,
        endpoint: string,
        options: {
            params?: Record<string, unknown>;
            data?: any;
            header?: Record<string, string | string[]>;
            responseType?: ResponseType;
        },
    ) {
        const apiKey = this.getHttpClientApiKey(client);
        const url = getInternalHttpRequestUrl(
            this.getInternalHttpConfig(),
            client,
            endpoint,
        );
        return lastValueFrom(
            this.httpService.request({
                method,
                url,
                data: options.data,
                params: options.params,
                headers: { ...options.header, "x-gw-api-key": apiKey },
                responseType: options.responseType,
                httpAgent: this.customHttpAgent,
                httpsAgent: this.customHttpsAgent,
            }),
        );
    }
}
