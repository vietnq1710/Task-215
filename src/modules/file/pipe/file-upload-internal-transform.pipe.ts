import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { CreateFileInternalDto } from "../dto/create-file-internal.dto.js";

export class FileUploadInternalTransform implements PipeTransform<
    CreateFileInternalDto,
    CreateFileInternalDto
> {
    transform(
        value: CreateFileInternalDto,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        metadata: ArgumentMetadata,
    ): CreateFileInternalDto {
        value.user = JSON.parse(value.user as string);
        return value;
    }
}
