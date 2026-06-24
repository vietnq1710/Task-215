import { ImportError } from "@common/constant/class/import-error";
import { ResponseErrorDto } from "@common/dto/response-error.dto";
import { ApiError } from "@config/exception/api-error";
import { ErrorCode } from "@config/exception/error-code";
import { HttpException, HttpStatus, Provider } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { ForeignKeyConstraintError, UniqueConstraintError } from "sequelize";

export const TRANSFORM_ERROR_MESSAGE_PROVIDER =
    "TRANSFORM_ERROR_MESSAGE_PROVIDER";

function transformForeignKeyErrorMessage(
    exception: ForeignKeyConstraintError,
    i18n: I18nService,
    lang?: string,
): string {
    const errorMessage = exception.parent["detail"];

    const matchReferenced: RegExpExecArray | null =
        /^Key \((.*?)\)=\((.*?)\) is still referenced from table "(.*?)"\.$/.exec(
            errorMessage,
        );

    const matchNotPresent =
        /^Key \((.*?)\)=\((.*?)\) is not present in table "(.*?)"\.$/.exec(
            errorMessage,
        );

    // const tableName = StringUtil.camelCaseToWord(exception.table).toUpperCase();
    if (matchReferenced) {
        // const fieldName = StringUtil.camelCaseToWord(matchReferenced[1]);
        // const fieldValue: string = matchReferenced[2];
        // const foreignTableName: string = StringUtil.camelCaseToWord(
        //     matchReferenced[3],
        // ).toUpperCase();
        // return `Không thể xóa do vẫn tồn tại các dòng ở bảng "${foreignTableName}" có "${tableName}" - "${fieldName}" là "${fieldValue}". Vui lòng xóa các dòng liên quan ở bảng "${foreignTableName}" trước`;

        return i18n.t(`error-message.common-foreign-key-in-use`, { lang });
    } else if (matchNotPresent) {
        // const fieldName: string = StringUtil.camelCaseToWord(
        //     matchNotPresent[1],
        // );
        const fieldValue: string = matchNotPresent[2];
        // const foreignTableName = StringUtil.capitalizeComponent(
        //     StringUtil.camelCaseToWord(matchNotPresent[3]),
        // );
        // return `Không thể tạo mới/cập nhật do trong bảng "${foreignTableName}" không tồn tại dòng có "${fieldName}" là '${fieldValue}'. Vui lòng thêm dòng tương ứng ở bảng "${foreignTableName}" trước`;
        return i18n.t(`error-message.common-foreign-key-not-exist`, {
            args: { value: fieldValue },
            lang,
        });
    } else {
        return errorMessage;
    }
}

function transformUniqueContraintErrorMessage(
    exception: UniqueConstraintError,
    i18n: I18nService,
    lang?: string,
): string {
    const errorMessage = exception.parent["detail"];
    const match: RegExpExecArray | null =
        /^Key \((.*?)\)=\((.*?)\) already exists\.$/.exec(errorMessage);
    if (match) {
        // const fieldName: string = StringUtil.camelCaseToWord(match[1]);
        const fieldValue: string = match[2];
        // return `Trường "${fieldName}" với giá trị '${fieldValue}' đã tồn tại. Vui lòng sử dụng giá trị khác.`;
        return i18n.t(`error-message.common-unique-duplicated`, {
            args: { value: fieldValue },
            lang,
        });
    } else {
        return errorMessage;
    }
}

export type TransformErrorMessage = {
    createError: (err: unknown) => ResponseErrorDto;
};

export const TransformErrorMessageProvider: Provider = {
    provide: TRANSFORM_ERROR_MESSAGE_PROVIDER,
    useFactory: (i18n: I18nService): TransformErrorMessage => {
        return {
            createError: (exception) => {
                let code: ErrorCode;
                let status: HttpStatus;
                let message: string;
                const lang = I18nContext.current()?.lang;

                if (exception instanceof ApiError) {
                    code = exception.getCode();
                    status = exception.getStatus();
                    message = i18n.t(`error-message.${exception.getCode()}`, {
                        args: exception.getArgs(),
                        lang,
                    });
                }
                if (exception instanceof HttpException) {
                    status = exception.getStatus();
                    const messsage: string | string[] =
                        exception.getResponse()?.["message"];
                    if (Array.isArray(messsage)) {
                        message = exception
                            .getResponse()
                            ?.["message"]?.join("; ");
                    } else {
                        message =
                            exception.getResponse()?.["message"] ||
                            exception.message;
                    }
                }
                if (exception instanceof ForeignKeyConstraintError) {
                    status = HttpStatus.BAD_REQUEST;
                    message = transformForeignKeyErrorMessage(
                        exception,
                        i18n,
                        lang,
                    );
                }
                if (exception instanceof UniqueConstraintError) {
                    status = HttpStatus.CONFLICT;
                    message = transformUniqueContraintErrorMessage(
                        exception,
                        i18n,
                        lang,
                    );
                }
                if (exception instanceof ImportError) {
                    status = HttpStatus.BAD_REQUEST;
                    message = exception.getMessages().join("; ");
                }
                if (!status) {
                    if (
                        exception["success"] === false &&
                        Object.prototype.hasOwnProperty.call(
                            exception,
                            "status",
                        )
                    ) {
                        status = exception["status"];
                        message = exception["message"] || "Error";
                    } else {
                        status = HttpStatus.INTERNAL_SERVER_ERROR;
                        message = "Internal Server Error";
                    }
                }

                return new ResponseErrorDto(code, status, message);
            },
        };
    },
    inject: [I18nService],
};
