import { getAppUrl } from "@common/constant";
import { Configuration } from "@config/configuration";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { NextFunction, Request, Response } from "express";
import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerModule,
} from "@nestjs/swagger";

type SwaggerProcessState = 0 | 1 | 2;

class SwaggerUtilLoader {
    private READY: SwaggerProcessState = 0;

    private normalizePath(path: string): string {
        const normalized = path.startsWith("/") ? path : `/${path}`;
        return normalized.replace(/\/+$/, "") || "/";
    }

    private setupBasicAuth(
        app: NestExpressApplication,
        configService: ConfigService<Configuration>,
        normalizedDocumentPath: string,
    ) {
        const { documentAuthUser, documentAuthPassword } = configService.get(
            "server",
            { infer: true },
        );
        const { prefix } = getAppUrl(configService);
        const prefixPath = prefix ? this.normalizePath(prefix) : "";

        const mainPath = this.normalizePath(
            `${prefixPath}${normalizedDocumentPath}`,
        );
        const internalPath = this.normalizePath(
            `${prefixPath}/internal${normalizedDocumentPath}`,
        );

        const protectedPaths = [
            mainPath,
            `${mainPath}-json`,
            internalPath,
            `${internalPath}-json`,
        ];

        app.use(
            protectedPaths,
            (req: Request, res: Response, next: NextFunction) => {
                const unauthorized = () => {
                    res.setHeader(
                        "WWW-Authenticate",
                        'Basic realm="Swagger Documentation"',
                    );
                    res.status(401).send("Unauthorized");
                };

                const authHeader = req.headers.authorization;
                if (!authHeader?.startsWith("Basic ")) {
                    return unauthorized();
                }

                const base64Credentials = authHeader.slice(6).trim();
                let decodedCredentials = "";
                try {
                    decodedCredentials = Buffer.from(
                        base64Credentials,
                        "base64",
                    ).toString("utf8");
                } catch {
                    return unauthorized();
                }

                const separatorIndex = decodedCredentials.indexOf(":");
                if (separatorIndex === -1) {
                    return unauthorized();
                }

                const username = decodedCredentials.slice(0, separatorIndex);
                const password = decodedCredentials.slice(separatorIndex + 1);

                if (
                    username !== documentAuthUser ||
                    password !== documentAuthPassword
                ) {
                    return unauthorized();
                }

                return next();
            },
        );
    }

    private getMainOpenApiObject(
        app: NestExpressApplication,
        configService: ConfigService<Configuration>,
    ) {
        const server = configService.get("server", { infer: true });
        const serverUrl = getAppUrl(configService);
        const SWAGGER_MAIN_CONFIG = new DocumentBuilder()
            .addServer(serverUrl.url, "Server")
            .addServer(`http://localhost:${server.port}`, "Local")
            .addApiKey(
                { type: "apiKey", name: "x-child-sso-id", in: "header" },
                "childSsoId",
            )
            .addApiKey(
                {
                    type: "apiKey",
                    name: "x-data-partition-code",
                    in: "header",
                },
                "dataPartitionCode",
            )
            .addApiKey(
                {
                    type: "apiKey",
                    name: "x-api-key",
                    in: "header",
                },
                "apiKey",
            )
            .addApiKey(
                {
                    type: "apiKey",
                    name: "x-gw-api-key",
                    in: "header",
                },
                "gwApiKey",
            )
            .addBearerAuth()
            .build();
        const mainDocument = SwaggerModule.createDocument(
            app,
            SWAGGER_MAIN_CONFIG,
        );
        return mainDocument;
    }

    private getInternalOpenApiObject(
        app: NestExpressApplication,
        configService: ConfigService<Configuration>,
    ) {
        const server = configService.get("server", { infer: true });
        const serverUrl = getAppUrl(configService);
        const SWAGGER_INTERNAL_CONFIG = new DocumentBuilder()
            .addServer(serverUrl.url, "Server")
            .addServer(`http://localhost:${server.port}`, "Local")
            .addApiKey(
                {
                    type: "apiKey",
                    name: "x-api-key",
                    in: "header",
                },
                "apiKey",
            )
            .addApiKey(
                {
                    type: "apiKey",
                    name: "x-gw-api-key",
                    in: "header",
                },
                "gwApiKey",
            )
            .build();
        const internalDocument = SwaggerModule.createDocument(
            app,
            SWAGGER_INTERNAL_CONFIG,
        );
        internalDocument.paths = Object.entries(internalDocument.paths)
            .filter((item) => item[0].startsWith("/internal/"))
            .reduce(
                (paths, item) => Object.assign(paths, { [item[0]]: item[1] }),
                {},
            );
        return internalDocument;
    }

    async setup(
        app: NestExpressApplication,
        configService: ConfigService<Configuration>,
    ) {
        if (this.READY === 0) {
            this.READY = 1;
            const { documentPath } = configService.get("server", {
                infer: true,
            });
            const CUSTOM_OPTIONS: SwaggerCustomOptions = {
                useGlobalPrefix: true,
                swaggerOptions: {
                    docExpansion: "none",
                    defaultModelsExpandDepth: -1,
                    displayRequestDuration: true,
                    filter: true,
                    operationsSorter: (a: any, b: any) => {
                        const order: { [field: string]: number } = {
                            get: 0,
                            post: 1,
                            put: 2,
                            patch: 3,
                            delete: 4,
                        };
                        const [pathA, methodA]: [string, string] = [
                            a._root.entries[0][1],
                            a._root.entries[1][1],
                        ];

                        const [pathB, methodB]: [string, string] = [
                            b._root.entries[0][1],
                            b._root.entries[1][1],
                        ];
                        return (
                            `${pathA}/`.localeCompare(`${pathB}/`) ||
                            order[methodA] - order[methodB] ||
                            0
                        );
                    },
                    plugins: [
                        () => {
                            return {
                                fn: {
                                    opsFilter: (
                                        taggedOps: any,
                                        phrase: string,
                                    ) => {
                                        return taggedOps.filter(
                                            (item: unknown, tag: string) => {
                                                return tag
                                                    .toLowerCase()
                                                    .includes(
                                                        phrase.toLowerCase(),
                                                    );
                                            },
                                        );
                                    },
                                },
                            };
                        },
                    ],
                },
            };

            const normalizedDocumentPath = documentPath.startsWith("/")
                ? documentPath
                : `/${documentPath}`;

            this.setupBasicAuth(app, configService, normalizedDocumentPath);

            SwaggerModule.setup(
                normalizedDocumentPath,
                app,
                () => this.getMainOpenApiObject(app, configService),
                CUSTOM_OPTIONS,
            );
            SwaggerModule.setup(
                `/internal${normalizedDocumentPath}`,
                app,
                () => this.getInternalOpenApiObject(app, configService),
                CUSTOM_OPTIONS,
            );
            this.READY = 2;
        }
    }
}

export const SwaggerUtil: SwaggerUtilLoader =
    global.SwaggerUtil || (global.SwaggerUtil = new SwaggerUtilLoader());
