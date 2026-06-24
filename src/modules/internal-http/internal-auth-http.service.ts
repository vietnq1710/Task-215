import { Configuration } from "@config/configuration";
import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Method, ResponseType } from "axios";
import { lastValueFrom } from "rxjs";
import {
    createSecureHttpAgent,
    createSecureHttpsAgent,
    HttpClientName,
    getInternalHttpRequestUrl,
} from "./common/constant";

type OAuthTokenResponse = {
    access_token: string;
    token_type?: string;
    expires_in?: number;
};

@Injectable()
export class InternalAuthHttpService {
    protected readonly customHttpAgent = createSecureHttpAgent();
    protected readonly customHttpsAgent = createSecureHttpsAgent();

    private cachedAccessToken = "";
    private cachedTokenExpireAt = 0;
    private inFlightTokenRequest?: Promise<string>;

    constructor(
        protected readonly httpService: HttpService,
        protected readonly configService: ConfigService<Configuration>,
    ) {}

    protected getInternalHttpConfig() {
        return this.configService.get("internal.http", { infer: true });
    }

    protected getOauthConfig() {
        return this.configService.get("server.oauth2", { infer: true });
    }

    protected async getAccessToken() {
        const now = Date.now();
        if (this.cachedAccessToken && now + 5000 < this.cachedTokenExpireAt) {
            return this.cachedAccessToken;
        }

        if (this.inFlightTokenRequest) {
            return this.inFlightTokenRequest;
        }

        this.inFlightTokenRequest = this.requestAccessToken();
        try {
            return await this.inFlightTokenRequest;
        } finally {
            this.inFlightTokenRequest = undefined;
        }
    }

    protected async requestAccessToken() {
        const oauthConfig = this.getOauthConfig();

        if (
            !oauthConfig?.tokenUrl ||
            !oauthConfig.clientId ||
            !oauthConfig.clientSecret
        ) {
            throw new InternalServerErrorException(
                "Missing OAuth2 client credential configuration",
            );
        }

        const tokenUrl = oauthConfig.tokenUrl?.trim();
        let parsedTokenUrl: URL;
        try {
            parsedTokenUrl = new URL(tokenUrl);
        } catch {
            throw new InternalServerErrorException("Invalid OAuth2 token URL");
        }

        if (!["http:", "https:"].includes(parsedTokenUrl.protocol)) {
            throw new InternalServerErrorException(
                "Unsupported OAuth2 token URL protocol",
            );
        }

        const body = new URLSearchParams({
            grant_type: "client_credentials",
            client_id: oauthConfig.clientId,
            client_secret: oauthConfig.clientSecret,
        });

        if (oauthConfig.scope) {
            body.append("scope", oauthConfig.scope);
        }

        if (oauthConfig.audience) {
            body.append("audience", oauthConfig.audience);
        }

        const response = await lastValueFrom(
            this.httpService.post<OAuthTokenResponse>(
                tokenUrl,
                body.toString(),
                {
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    httpAgent: this.customHttpAgent,
                    httpsAgent: this.customHttpsAgent,
                },
            ),
        );

        if (!response.data?.access_token) {
            throw new InternalServerErrorException(
                "OAuth2 response does not contain access_token",
            );
        }

        const expiresInSeconds = Number(response.data.expires_in) || 60;
        this.cachedAccessToken = response.data.access_token;
        this.cachedTokenExpireAt =
            Date.now() + Math.max(expiresInSeconds, 1) * 1000;

        return this.cachedAccessToken;
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
        const accessToken = await this.getAccessToken();
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
                headers: {
                    ...options.header,
                    Authorization: `Bearer ${accessToken}`,
                },
                responseType: options.responseType,
                httpAgent: this.customHttpAgent,
                httpsAgent: this.customHttpsAgent,
            }),
        );
    }
}
