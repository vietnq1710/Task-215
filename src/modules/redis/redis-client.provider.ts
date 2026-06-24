import { Configuration } from "@config/configuration";
import { Inject, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

const REDIS_CLIENT = "REDIS_CLIENT";
export const InjectRedisClient = () => Inject(REDIS_CLIENT);

export const RedisClientProvider: Provider = {
    provide: REDIS_CLIENT,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<Configuration>) => {
        const { host, port, password, tls, rejectUnauthorized, tlsCAFile } =
            configService.get("redis", {
                infer: true,
            });
        const { name } = configService.get("server", { infer: true });
        const redis = new Redis(port, host, {
            password,
            keyPrefix: name,
            tls: tls
                ? {
                      rejectUnauthorized,
                      ca: tlsCAFile,
                  }
                : undefined,
        });
        return redis;
    },
};
