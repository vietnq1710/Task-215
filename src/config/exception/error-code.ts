import { FileErrorCode } from "@module/file/common/constant";

export type ErrorCode =
    | "error-user-not-found"
    | "error-user-exist"
    | "error-password-wrong"
    | "error-old-password-wrong"
    | "error-duplicate-new-password"
    | "error-mimetype-invalid"
    | "error-network-restricted"
    | "error-unauthorized"
    | "error-forbidden"
    | "error-one-signal-id-not-found"
    | "error-topic-not-found"
    | "error-topic-subscribed"
    | "error-topic-subscription-limit-exceed"
    | "error-setting-value-invalid"
    | "error-setting-incomplete"
    | "error-file-invalid-mimetype"
    | "error-file-not-found"
    | "error-import-transaction-empty"
    | "error-quy-tac-not-found"
    | FileErrorCode;
