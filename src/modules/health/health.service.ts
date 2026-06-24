import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    HealthCheckService,
    HealthCheckResult,
    MongooseHealthIndicator,
    SequelizeHealthIndicator,
} from "@nestjs/terminus";
import { InjectRedisClient } from "@module/redis/redis-client.provider";
import Redis from "ioredis";

@Injectable()
export class HealthService {
    constructor(
        private health: HealthCheckService,
        private configService: ConfigService,
        @Optional() private db?: SequelizeHealthIndicator,
        @Optional() private mongoose?: MongooseHealthIndicator,
        @Optional() @InjectRedisClient() private redis?: Redis,
    ) {}

    checkLiveness(): Promise<HealthCheckResult> {
        return this.health.check([]);
    }

    async checkReadiness(): Promise<HealthCheckResult> {
        const checks = [];

        const mongoUri = this.configService.get<string>("mongodb.uri");
        if (mongoUri && this.mongoose) {
            checks.push(() => this.mongoose.pingCheck("mongodb"));
        }

        const sqlHost = this.configService.get<string>("sql.host");
        if (sqlHost && this.db) {
            checks.push(() => this.db.pingCheck("database"));
        }

        const redisHost = this.configService.get<string>("redis.host");
        if (redisHost && this.redis) {
            checks.push(async () => {
                try {
                    await this.redis.ping();
                    return {
                        redis: {
                            status: "up",
                        },
                    };
                } catch (error) {
                    throw new Error(
                        `Redis health check failed: ${error.message}`,
                    );
                }
            });
        }

        if (checks.length === 0) {
            return { status: "ok", info: {}, error: {}, details: {} };
        }

        return this.health.check(checks);
    }
}
