import {
    BadRequestException,
    InternalServerErrorException,
} from "@nestjs/common";
import * as dns from "dns";
import * as http from "http";
import * as https from "https";
import * as ipaddr from "ipaddr.js";

export const InternalHttpClients = ["core", "file"] as const;

export type HttpClientName = (typeof InternalHttpClients)[number];

export type InternalHttpClientConfig = {
    address?: string;
    apiKey?: string;
};

export type InternalHttpConfig = Partial<
    Record<HttpClientName, InternalHttpClientConfig>
>;

export const getInternalHttpClientConfig = (
    internalHttpConfig: InternalHttpConfig | undefined,
    client: HttpClientName,
) => internalHttpConfig?.[client];

export const getInternalHttpClientAddress = (
    internalHttpConfig: InternalHttpConfig | undefined,
    client: HttpClientName,
) => {
    const address = getInternalHttpClientConfig(
        internalHttpConfig,
        client,
    )?.address;

    if (!address) {
        throw new InternalServerErrorException(
            `Missing internal HTTP address for ${client}`,
        );
    }

    return address;
};

export const secureDnsLookup = (
    hostname: string,
    options: dns.LookupOptions,
    callback: (
        err: NodeJS.ErrnoException | null,
        address: string | dns.LookupAddress[],
        family?: number,
    ) => void,
) => {
    dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err, address, family);

        try {
            const isSafeIp = (ipString: string): boolean => {
                const ip = ipaddr.parse(ipString);
                const range = ip.range();
                return ["private", "loopback", "linkLocal"].includes(range);
            };

            let isSafe = true;
            let blockedIp = "";

            if (Array.isArray(address)) {
                for (const addr of address) {
                    if (!isSafeIp(addr.address)) {
                        isSafe = false;
                        blockedIp = addr.address;
                        break;
                    }
                }
            } else {
                if (!isSafeIp(address)) {
                    isSafe = false;
                    blockedIp = address;
                }
            }

            if (isSafe) {
                return callback(null, address, family);
            }

            const error = new Error(
                `SSRF Blocked: ${hostname} resolved to public IP (${blockedIp})`,
            ) as NodeJS.ErrnoException;
            error.code = "ESSRFBLOCKED";
            return callback(error, address, family);
        } catch {
            const error = new Error(
                "Invalid IP format detected during DNS lookup",
            ) as NodeJS.ErrnoException;
            error.code = "EINVALIDIP";
            return callback(error, address, family);
        }
    });
};

export const createSecureHttpAgent = () =>
    new http.Agent({
        lookup: secureDnsLookup,
    });

export const createSecureHttpsAgent = () =>
    new https.Agent({
        lookup: secureDnsLookup,
    });

export const normalizeEndpoint = (endpoint: string) => {
    const ep = endpoint?.trim();
    if (!ep || /^(?:\/|\\|\/\/|[a-z][a-z0-9+.-]*:)/i.test(ep)) {
        throw new BadRequestException("Invalid internal HTTP endpoint");
    }

    const segments = ep.split("/");
    if (
        segments.some(
            (seg) => !seg || /^(?:\.\.?)$/.test(seg) || /%2[ef]|%5c/i.test(seg),
        )
    ) {
        throw new BadRequestException("Invalid internal HTTP endpoint");
    }

    return segments;
};

export const buildRequestUrl = (
    address: string,
    client: HttpClientName,
    endpoint: string,
) => {
    let baseUrl: URL;
    try {
        baseUrl = new URL(address);
    } catch {
        throw new InternalServerErrorException(
            `Invalid internal HTTP address for ${client}`,
        );
    }

    if (!["http:", "https:"].includes(baseUrl.protocol)) {
        throw new InternalServerErrorException(
            `Unsupported internal HTTP protocol for ${client}`,
        );
    }

    const segments = normalizeEndpoint(endpoint);
    const basePath = baseUrl.pathname.replace(/\/$/, "");

    baseUrl.pathname = `${basePath}/${segments.map(encodeURIComponent).join("/")}`;
    baseUrl.search = "";
    baseUrl.hash = "";

    return baseUrl.toString();
};

export const getInternalHttpRequestUrl = (
    internalHttpConfig: InternalHttpConfig | undefined,
    client: HttpClientName,
    endpoint: string,
) => {
    const address = getInternalHttpClientAddress(internalHttpConfig, client);
    return buildRequestUrl(address, client, endpoint);
};
