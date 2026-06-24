import { SystemRole } from "@module/user/common/constant";
import { ClientPlatform } from "./common/constant";

export interface AccessSsoJwtPayload {
    iat?: number;
    jti: string;
    sub: string;
    id: string;
    scope: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;

    auth?: string;
    exp?: number;
    platform?: ClientPlatform;
    systemRole?: SystemRole;
}

export interface RefreshSsoJwtPayload {
    jti: string;
    sub: string;
    scope: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;

    auth?: string;
    exp?: number;
    platform?: ClientPlatform;
    systemRole?: SystemRole;
}
