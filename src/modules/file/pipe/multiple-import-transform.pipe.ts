import { MultipleImportDto } from "@common/dto/multiple-import.dto.js";
import { ArgumentMetadata, PipeTransform } from "@nestjs/common";

export class MultipleImportTransformPipe implements PipeTransform<
    MultipleImportDto,
    MultipleImportDto
> {
    transform(
        value: MultipleImportDto,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        metadata: ArgumentMetadata,
    ): MultipleImportDto {
        value.force = String(value.force) === "1";
        return value;
    }
}
