import { HttpStatus } from "@nestjs/common";

export enum LogLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal",
    SILENT = "silent",
}

export enum ErrorType {
    SERVER_ERROR = "server_error",
    NOT_FOUND = "not_found",
    UNAUTHORIZED = "unauthorized",
    FORBIDDEN = "forbidden",
    VALIDATION_ERROR = "validation_error",
    METHOD_NOT_ALLOWED = "method_not_allowed",
    CONFLICT = "conflict",
    RATE_LIMIT = "rate_limit",
    CLIENT_ERROR = "client_error",
    UNKNOWN = "unknown",
}

export interface ErrorLogConfig {
    level: LogLevel;
    errorType: ErrorType;
    label: string;
}

export const HTTP_ERROR_CONFIG_MAP: Record<number, ErrorLogConfig> = {
    [HttpStatus.NOT_FOUND]: {
        level: LogLevel.INFO,
        errorType: ErrorType.NOT_FOUND,
        label: "Not Found",
    },
    [HttpStatus.UNAUTHORIZED]: {
        level: LogLevel.WARN,
        errorType: ErrorType.UNAUTHORIZED,
        label: "Auth Error",
    },
    [HttpStatus.FORBIDDEN]: {
        level: LogLevel.WARN,
        errorType: ErrorType.FORBIDDEN,
        label: "Auth Error",
    },
    [HttpStatus.BAD_REQUEST]: {
        level: LogLevel.WARN,
        errorType: ErrorType.VALIDATION_ERROR,
        label: "Validation Error",
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
        level: LogLevel.WARN,
        errorType: ErrorType.VALIDATION_ERROR,
        label: "Validation Error",
    },
    [HttpStatus.METHOD_NOT_ALLOWED]: {
        level: LogLevel.WARN,
        errorType: ErrorType.METHOD_NOT_ALLOWED,
        label: "Method Not Allowed",
    },
    [HttpStatus.CONFLICT]: {
        level: LogLevel.WARN,
        errorType: ErrorType.CONFLICT,
        label: "Conflict",
    },
    [HttpStatus.TOO_MANY_REQUESTS]: {
        level: LogLevel.WARN,
        errorType: ErrorType.RATE_LIMIT,
        label: "Rate Limit",
    },
};
