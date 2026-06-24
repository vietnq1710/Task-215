import tracer from "@config/traces";

import { getAppUrl } from "@common/constant";
import { TcpPayloadTransformPipe } from "@common/pipe/tcp-payload-transform.pipe";
import { SwaggerUtil } from "@common/utils/swagger.util";
import { Configuration, getEnv } from "@config/configuration";
import { TcpSocket } from "@config/tcp/tcp-socket";
import { getServerGrpcConfig } from "@module/microservice/grpc/common/constant";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { GrpcOptions, TcpOptions, Transport } from "@nestjs/microservices";
import { NestExpressApplication } from "@nestjs/platform-express";
import { json, urlencoded } from "body-parser";
import { I18nMiddleware } from "nestjs-i18n";
import "reflect-metadata";
import { AppModule } from "./app.module";
// import { Logger } from "nestjs-pino";

async function bootstrap() {
    const enable = getEnv("OTEL_ENABLED", "0");
    if (enable === "1") {
        tracer();
    }
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    // app.useLogger(app.get(Logger));
    app.set("query parser", "extended");
    const configService = app.get(ConfigService<Configuration>);
    const serverUrl = getAppUrl(configService);
    app.setGlobalPrefix(serverUrl.prefix);

    app.use(I18nMiddleware);

    app.enableCors();
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidUnknownValues: false,
        }),
    );

    app.use(json({ limit: "50mb" }));
    app.use(urlencoded({ limit: "50mb", extended: true }));

    const { gRPC, tcp } = configService.get("microservice", {
        infer: true,
    });
    const protoConfig = getServerGrpcConfig();

    app.connectMicroservice<GrpcOptions>({
        transport: Transport.GRPC,
        options: {
            package: protoConfig.packages,
            protoPath: protoConfig.paths,
            url: gRPC.url,
        },
    });

    const tcpMicroservice = app.connectMicroservice<TcpOptions>({
        transport: Transport.TCP,
        options: {
            host: tcp.host,
            port: tcp.port,
            retryAttempts: 5,
            retryDelay: 1000,
            socketClass: TcpSocket,
        },
    });
    tcpMicroservice.useGlobalPipes(new TcpPayloadTransformPipe());

    await SwaggerUtil.setup(app, configService);
    await app.startAllMicroservices();
    await app.listen(configService.get("server.port", { infer: true }));
}
bootstrap();
