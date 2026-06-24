import { IsEnum } from "class-validator";

export enum FileUploadTarget {
    LOCAL = "LOCAL",
    INTERNAL = "INTERNAL",
}

export class SettingFileUpload {
    @IsEnum(FileUploadTarget)
    target: FileUploadTarget;
}
