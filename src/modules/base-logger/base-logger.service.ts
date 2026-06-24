import { Injectable } from "@nestjs/common";
import { Request } from "express";
import moment from "moment";
// import { PinoLogger } from "nestjs-pino";
import {
    ErrorLogConfig,
    ErrorType,
    HTTP_ERROR_CONFIG_MAP,
    LogLevel,
} from "./common/constant";

export interface HttpErrorContext {
    request: Request;
    statusCode: number;
    errorCode?: string;
    errorMessage?: string;
    exception: any;
}

@Injectable()
export class BaseLoggerService {
    // constructor(private readonly pinoLogger: PinoLogger) {}

    // trace(obj: object, msg?: string): void {
    //     this.pinoLogger.trace(obj, msg);
    // }

    // debug(obj: object, msg?: string): void {
    //     this.pinoLogger.debug(obj, msg);
    // }

    // info(obj: object, msg?: string): void {
    //     this.pinoLogger.info(obj, msg);
    // }

    // warn(obj: object, msg?: string): void {
    //     this.pinoLogger.warn(obj, msg);
    // }

    // error(obj: object, msg?: string): void {
    //     this.pinoLogger.error(obj, msg);
    // }

    // fatal(obj: object, msg?: string): void {
    //     this.pinoLogger.fatal(obj, msg);
    // }

    // log(level: LogLevel, obj: object, msg?: string): void {
    //     const logMethods: Record<
    //         LogLevel,
    //         (obj: object, msg?: string) => void
    //     > = {
    //         [LogLevel.TRACE]: (o, m) => this.pinoLogger.trace(o, m),
    //         [LogLevel.DEBUG]: (o, m) => this.pinoLogger.debug(o, m),
    //         [LogLevel.INFO]: (o, m) => this.pinoLogger.info(o, m),
    //         [LogLevel.WARN]: (o, m) => this.pinoLogger.warn(o, m),
    //         [LogLevel.ERROR]: (o, m) => this.pinoLogger.error(o, m),
    //         [LogLevel.FATAL]: (o, m) => this.pinoLogger.fatal(o, m),
    //         [LogLevel.SILENT]: () => {},
    //     };

    //     logMethods[level](obj, msg);
    // }

    logHttpException(context: HttpErrorContext): void {
        // const { request, statusCode, errorCode, errorMessage, exception } =
        //     context;
        // const config = this.getErrorConfig(statusCode);
        // const logData = this.buildHttpErrorLog(
        //     request,
        //     statusCode,
        //     errorCode,
        //     errorMessage,
        //     exception,
        //     config,
        // );
        // const message = this.buildLogMessage(request, statusCode, config.label);
        // this.log(config.level, logData, message);
    }

    private getErrorConfig(statusCode: number): ErrorLogConfig {
        if (statusCode >= 500) {
            return {
                level: LogLevel.ERROR,
                errorType: ErrorType.SERVER_ERROR,
                label: "Server Error",
            };
        }

        if (HTTP_ERROR_CONFIG_MAP[statusCode]) {
            return HTTP_ERROR_CONFIG_MAP[statusCode];
        }

        if (statusCode >= 400) {
            return {
                level: LogLevel.WARN,
                errorType: ErrorType.CLIENT_ERROR,
                label: "Client Error",
            };
        }

        return {
            level: LogLevel.INFO,
            errorType: ErrorType.UNKNOWN,
            label: undefined,
        };
    }

    private buildHttpErrorLog(
        request: Request,
        statusCode: number,
        errorCode: string,
        errorMessage: string,
        exception: any,
        config: ErrorLogConfig,
    ): Record<string, any> {
        const baseLog = {
            timestamp: moment().format("DD/MM/YYYY HH:mm:ss"),
            method: request.method,
            url: request.originalUrl,
            path: request.path,
            ip: request.ip,
            statusCode,
            error: {
                code: errorCode,
                message: errorMessage,
            },
            requestId: request.headers["x-request-id"],
            exception: exception?.message,
            level: config.level,
            errorType: config.errorType,
        };

        if (
            config.level === LogLevel.ERROR ||
            config.level === LogLevel.FATAL
        ) {
            return { ...baseLog, stack: exception?.stack };
        }

        return baseLog;
    }

    private buildLogMessage(
        request: Request,
        statusCode: number,
        label?: string,
    ): string {
        const suffix = label ? `${label} ${statusCode}` : `${statusCode}`;
        return `[${request.method}] ${request.originalUrl} - ${suffix}`;
    }
}
