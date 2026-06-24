import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get("live")
    @HealthCheck()
    @ApiOperation({
        summary: "Liveness probe",
        description:
            "Kiểm tra server có đang chạy hay không. Nếu fail, Kubernetes sẽ restart pod.",
    })
    @ApiResponse({
        status: 200,
        description: "Server đang hoạt động",
        schema: {
            example: {
                status: "ok",
                info: {},
                error: {},
                details: {},
            },
        },
    })
    @ApiResponse({
        status: 503,
        description: "Server không hoạt động",
    })
    checkLiveness(): Promise<HealthCheckResult> {
        return this.healthService.checkLiveness();
    }

    @Get("ready")
    @HealthCheck()
    @ApiOperation({
        summary: "Readiness probe",
        description:
            "Kiểm tra server có sẵn sàng nhận traffic hay không. Nếu fail, Kubernetes sẽ ngừng gửi traffic đến pod.",
    })
    @ApiResponse({
        status: 200,
        description: "Server sẵn sàng nhận request",
        schema: {
            example: {
                status: "ok",
                info: {
                    database: {
                        status: "up",
                    },
                    mongodb: {
                        status: "up",
                    },
                    redis: {
                        status: "up",
                    },
                },
                error: {},
                details: {
                    database: {
                        status: "up",
                    },
                    mongodb: {
                        status: "up",
                    },
                    redis: {
                        status: "up",
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 503,
        description: "Server chưa sẵn sàng nhận request",
    })
    checkReadiness(): Promise<HealthCheckResult> {
        return this.healthService.checkReadiness();
    }
}
