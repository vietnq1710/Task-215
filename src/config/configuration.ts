import { FileStorageType } from "@module/file/common/constant";
import { InternalHttpClients } from "@module/internal-http/common/constant";
import { TcpClients } from "@module/microservice/tcp/tcp-client.provider";
import { Logger } from "@nestjs/common";
import { Region } from "minio";

const logger = new Logger("Configuration");

export const getEnv = (key: string, defaultValue?: string): string => {
    let value = process.env[key];
    if (value === undefined) {
        const message = [`${key} empty`];
        if (defaultValue !== undefined) {
            message.push(`use default: ${defaultValue}`);
            value = defaultValue;
        }
        logger.warn(message.join(", "));
    }
    return value;
};

export enum Environment {
    PRODUCTION = "production",
    STAGING = "staging",
    DEVELOPMENT = "development",
}

export interface Configuration {
    server: {
        env: Environment;
        name: string;
        port: number;
        address: string;
        documentPath: string;
        documentAuthUser: string;
        documentAuthPassword: string;
        defaultAdminUsername: string;
        microserviceDocumentPath: string;
        defaultAdminPassword: string;
        defaultFileStorage: FileStorageType;
        gwAddress: string;
        gwApiKey: string;
        oauth2: {
            tokenUrl: string;
            clientId: string;
            clientSecret: string;
            scope?: string;
            audience?: string;
        };
        cron: boolean;
        timezone: string;
        proxy: boolean;
        logSystem: boolean;
    };
    microservice: {
        gRPC: {
            url: string;
            client: { [module: string]: { url: string } };
        };
        tcp: {
            host: string;
            port: number;
            client: {
                [module in (typeof TcpClients)[number]]: {
                    host: string;
                    port: number;
                };
            };
        };
        rabbitMQ: {
            url: string;
        };
    };
    internal: {
        http: {
            [client in (typeof InternalHttpClients)[number]]: {
                address?: string;
                apiKey?: string;
            };
        };
    };
    jwt: {
        secret: string;
        exp: number;
        refreshSecret: string;
        refreshExp: number;
    };
    mongodb: {
        uri: string;
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        name?: string;
        tls: boolean;
        tlsCAFile?: string;
        tlsServerName?: string;
    };
    sql: {
        type: string;
        host: string;
        port: number;
        username: string;
        password: string;
        schema: string;
        database: string;
        maxPool: number;
        useSSL: boolean;
        rejectUnauthorized: boolean;
        tlsCAFile?: string;
        defaultSoftDelete: boolean;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        tls: boolean;
        rejectUnauthorized: boolean;
        tlsCAFile?: string;
    };
    oneSignal: {
        appId: string;
        apiKey: string;
    };
    sso: {
        jwksUri: string;
        usernameField: string;
        emailField: string;
        firstNameField: string;
        lastNameField: string;
        idField: string;
    };
    sentry: {
        dsn: string;
    };
    minio: {
        endPoint: string;
        port: number;
        useSsl: boolean;
        address: string;
        accessKey: string;
        secretKey: string;
        region: Region;
        bucket: string;
        multipartPartSize: number;
    };
    otel: {
        tracesExporter: string;
        serviceName: string;
        nodeResourceDetectors: string;
        exporterOtlpEndpoint: string;
        ingestionKey: string;
    };

    loki: {
        enabled: boolean;
        url: string;
        serviceName: string;
    };
}

export default (): Configuration => {
    const serverPort = Number(getEnv("SERVER_PORT")) || 3000;
    const server: Configuration["server"] = {
        env: getEnv("SERVER_ENV", Environment.DEVELOPMENT) as Environment,
        name: getEnv("SERVER_NAME"),
        address: getEnv("SERVER_ADDRESS", `http://localhost:${serverPort}`),
        port: serverPort,
        documentPath: getEnv("SERVER_DOCUMENT_PATH", "api"),
        documentAuthUser: getEnv("SERVER_DOCUMENT_AUTH_USER", "user"),
        documentAuthPassword: getEnv(
            "SERVER_DOCUMENT_AUTH_PASSWORD",
            "password",
        ),
        defaultAdminUsername: getEnv("SERVER_DEFAULT_ADMIN_PASSWORD", "admin"),
        microserviceDocumentPath: getEnv(
            "SERVER_MICROSERVICE_DOCUMENT_PATH",
            "microservice/api",
        ),
        defaultAdminPassword: getEnv("SERVER_DEFAULT_ADMIN_PASSWORD", "admin"),
        defaultFileStorage: getEnv(
            "SEVER_DEFAULT_FILE_STORAGE",
            "Database",
        ) as FileStorageType,
        gwAddress: getEnv("SERVER_GW_ADDRESS"),
        gwApiKey: getEnv("SERVER_GW_API_KEY"),
        oauth2: {
            tokenUrl: getEnv("SERVER_OAUTH2_TOKEN_URL"),
            clientId: getEnv("SERVER_OAUTH2_CLIENT_ID"),
            clientSecret: getEnv("SERVER_OAUTH2_CLIENT_SECRET"),
            scope: getEnv("SERVER_OAUTH2_SCOPE"),
            audience: getEnv("SERVER_OAUTH2_AUDIENCE"),
        },
        cron: getEnv("SERVER_CRON", "1") === "1",
        timezone: getEnv("SERVER_TIMEZONE", "Asia/Ho_Chi_Minh"),
        proxy: getEnv("SERVER_PROXY", "0") === "1",
        logSystem: getEnv("SERVER_LOG_SYSTEM", "0") === "1",
    };

    const microserviceGrpcHost = getEnv("MICROSERVICE_GRPC_HOST", "0.0.0.0");
    const microserviceGrpcPort = getEnv("MICROSERVICE_GRPC_PORT", "3001");

    const microserviceTcpHost = getEnv("MICROSERVICE_TCP_HOST", "0.0.0.0");
    const microserviceTcpPort = Number(getEnv("MICROSERVICE_TCP_PORT", "3002"));

    // Modify to local in core app
    const microserviceTcpHostCore = getEnv("MICROSERVICE_TCP_HOST_CORE");
    const microserviceTcpPortCore = Number(
        getEnv("MICROSERVICE_TCP_PORT_CORE"),
    );

    const microservice: Configuration["microservice"] = {
        gRPC: {
            url: `${microserviceGrpcHost}:${microserviceGrpcPort}`,
            client: {
                local: {
                    url: `localhost:${microserviceGrpcPort}`,
                },
            },
        },
        tcp: {
            host: microserviceTcpHost,
            port: microserviceTcpPort,
            client: {
                local: {
                    host: microserviceTcpHost,
                    port: microserviceTcpPort,
                },
                core: {
                    host: microserviceTcpHostCore,
                    port: microserviceTcpPortCore,
                },
            },
        },
        rabbitMQ: {
            url: getEnv("MICROSERVICE_RABBITMQ_URL"),
        },
    };

    const jwt: Configuration["jwt"] = {
        secret: getEnv("JWT_SECRET"),
        exp: Number(getEnv("JWT_EXP")) || undefined,
        refreshSecret: getEnv("JWT_REFRESH_SECRET"),
        refreshExp: Number(getEnv("JWT_REFRESH_EXP")) || undefined,
    };

    const mongodb: Configuration["mongodb"] = {
        uri: getEnv("MONGODB_URI") || getEnv("DB_URI"),
        tls: getEnv("MONGODB_TLS", "0") === "1",
        tlsCAFile: getEnv("MONGODB_TLS_CA_FILE"),
    };
    if (!mongodb.uri) {
        mongodb.host = getEnv("MONGODB_HOST", "localhost");
        mongodb.port = Number(getEnv("MONGODB_PORT"));
        mongodb.name = getEnv("MONGODB_NAME");
        mongodb.username = getEnv("MONGODB_USER");
        mongodb.password = getEnv("MONGODB_PASSWORD");
    }

    const sql: Configuration["sql"] = {
        type: getEnv("SQL_TYPE", "postgres"),
        host: getEnv("SQL_HOST"),
        port: Number(getEnv("SQL_PORT")),
        username: getEnv("SQL_USER"),
        password: getEnv("SQL_PASSWORD"),
        schema: getEnv("SQL_SCHEMA"),
        database: getEnv("SQL_DB"),
        maxPool: Number(getEnv("SQL_DB_MAX_POOL", "5")),
        useSSL: getEnv("SQL_USE_SSL", "0") === "1",
        rejectUnauthorized: getEnv("SQL_SSL_REJECT_UNAUTHORIZED", "0") === "1",
        tlsCAFile: getEnv("SQL_TLS_CA_FILE"),
        defaultSoftDelete: getEnv("SQL_DEFAULT_SOFT_DELETE", "0") === "1",
    };

    const redis: Configuration["redis"] = {
        host: getEnv("REDIS_HOST"),
        port: Number(getEnv("REDIS_PORT")),
        password: getEnv("REDIS_PASSWORD"),
        tls: getEnv("REDIS_TLS", "0") === "1",
        rejectUnauthorized:
            getEnv("REDIS_TLS_REJECT_UNAUTHORIZED", "0") === "1",
        tlsCAFile: getEnv("REDIS_TLS_CA_FILE"),
    };

    const oneSignal: Configuration["oneSignal"] = {
        appId: getEnv("ONE_SIGNAL_APP_ID"),
        apiKey: getEnv("ONE_SIGNAL_API_KEY"),
    };

    const sso: Configuration["sso"] = {
        jwksUri: getEnv("SSO_JWKS_URI"),
        usernameField: getEnv("SSO_USERNAME_FIELD", "preferred_username"),
        emailField: getEnv("SSO_EMAIL_FIELD", "email"),
        firstNameField: getEnv("SSO_EMAIL_FIELD", "given_name"),
        lastNameField: getEnv("SSO_EMAIL_FIELD", "family_name"),
        idField: getEnv("SSO_ID_FIELD", "sub"),
    };
    const sentry: Configuration["sentry"] = {
        dsn: getEnv("SENTRY_DSN"),
    };

    const minio: Configuration["minio"] = {
        endPoint: getEnv("MINIO_ENDPOINT", "localhost"),
        port: Number(getEnv("MINIO_PORT")),
        useSsl: getEnv("MINIO_USE_SSL", "1") === "1",
        address: getEnv("MINIO_ADDRESS"),
        accessKey: getEnv("MINIO_ACCESS_KEY"),
        secretKey: getEnv("MINIO_SECRET_KEY"),
        region: getEnv("MINIO_REGION"),
        bucket: getEnv("MINIO_BUCKET"),
        multipartPartSize: Number(
            getEnv("MINIO_MULTIPART_PART_SIZE", "16777216"),
        ),
    };
    const otel: Configuration["otel"] = {
        serviceName: getEnv("OTEL_SERVICE_NAME", "aisoft-backend"),
        tracesExporter: getEnv("OTEL_TRACES_EXPORTER", "otlp"),
        exporterOtlpEndpoint: getEnv("OTEL_EXPORTER_OTLP_ENDPOINT"),
        ingestionKey: getEnv("OTEL_INGESTION_KEY"),
        nodeResourceDetectors: getEnv(
            "OTEL_NODE_RESOURCE_DETECTORS",
            "env,host,os",
        ),
    };
    const internalHttp: Configuration["internal"]["http"] = {
        core: {
            address: getEnv("CORE_INTERNAL_HTTP_ADDRESS"),
            apiKey: getEnv("CORE_INTERNAL_HTTP_API_KEY"),
        },
        file: {
            address: getEnv("FILE_INTERNAL_HTTP_ADDRESS"),
            apiKey: getEnv("FILE_INTERNAL_HTTP_API_KEY"),
        },
    };

    const loki: Configuration["loki"] = {
        enabled: getEnv("LOKI_ENABLED", "0") === "1",
        url: getEnv("LOKI_URL"),
        serviceName: getEnv("LOKI_SERVICE_NAME", "aisoft-backend"),
    };

    return {
        server,
        microservice,
        internal: { http: internalHttp },
        jwt,
        mongodb,
        sql,
        redis,
        oneSignal,
        sso,
        sentry,
        minio,
        otel,
        loki,
    };
};
