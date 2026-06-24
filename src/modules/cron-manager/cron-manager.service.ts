import { Configuration } from "@config/configuration";
import { InjectRedisClient } from "@module/redis/redis-client.provider";
import { Injectable, Type } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class CronManagerService {
    constructor(
        @InjectRedisClient() private readonly redis: Redis,
        private readonly configService: ConfigService<Configuration>,
    ) {}

    private getCronName<T>(instance: Type<T>, functionName: keyof T) {
        return `${instance.name}.${functionName.toString()}`;
    }

    /**
     * Check if this server is enable to run cron jobs
     */
    private isCronServer() {
        return this.configService.get("server.cron", { infer: true });
    }

    async isCronLeader<T>(
        instance: Type<T>,
        functionName: keyof T,
    ): Promise<boolean> {
        if (this.isCronServer()) {
            try {
                const cronName = this.getCronName(instance, functionName);
                const acquired = await this.redis.set(
                    cronName,
                    process.pid,
                    "EX",
                    32,
                    "NX",
                );
                return Boolean(acquired);
            } catch (err) {
                console.error("Error cron leader acquire", err);
                return false;
            }
        }
    }
}
