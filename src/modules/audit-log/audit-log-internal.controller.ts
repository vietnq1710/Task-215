import { InternalController } from "@common/decorator/route.decorator";
import { Delete } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";

@InternalController("audit-log")
export class AuditLogInternalController {
    constructor(private readonly auditLogService: AuditLogService) {}

    @Delete("expired")
    async deleteExpired() {
        await this.auditLogService.clearOldLog();
    }
}
