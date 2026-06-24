import {
    TRANSFORM_ERROR_MESSAGE_PROVIDER,
    TransformErrorMessage,
} from "@common/provider/transform-error-message.provider";
import { Configuration } from "@config/configuration";
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    Inject,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import moment from "moment";
import { throwError } from "rxjs";

@Catch()
@Injectable()
export class CommonExceptionFilter implements ExceptionFilter {
    private server: Configuration["server"];

    constructor(
        configService: ConfigService<Configuration>,
        @Inject(TRANSFORM_ERROR_MESSAGE_PROVIDER)
        private readonly transform: TransformErrorMessage,
        // private readonly loggingService: BaseLoggerService,
    ) {
        this.server = configService.get("server", { infer: true });
    }

    catch(exception: any, host: ArgumentsHost) {
        const errResponse = this.transform.createError(exception);
        const hostType = host.getType();

        if (hostType === "rpc") {
            console.error(
                `\n${moment().format("DD/MM/YYYY HH:mm:ss")}`,
                "RPC",
                {
                    ...errResponse,
                },
            );
            if (this.server.logSystem) {
                console.error(exception);
                errResponse.detail = {
                    exception,
                    stack: exception?.stack,
                    message: exception?.message ? exception.message : undefined,
                };
            } else {
                console.error(exception?.message);
            }
            return throwError(() => errResponse);
        }

        if (hostType === "http") {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse<Response>();
            const statusCode = errResponse.getStatus();

            // this.loggingService.logHttpException({
            //     request,
            //     statusCode,
            //     errorCode: errResponse.getCode(),
            //     errorMessage: errResponse.message,
            //     exception,
            // });
            const request = ctx.getRequest<Request>();
            console.error(
                `\n${moment().format("DD/MM/YYYY HH:mm:ss")}`,
                request.method,
                request.originalUrl,
                { ...errResponse },
            );
            if (this.server.logSystem) {
                console.error(exception);
                errResponse.detail = {
                    exception,
                    stack: exception?.stack,
                    message: exception?.message ? exception.message : undefined,
                };
            } else {
                console.error(exception?.message);
            }
            return response.status(statusCode).json(errResponse);
        }
        throw new InternalServerErrorException();
    }
}
