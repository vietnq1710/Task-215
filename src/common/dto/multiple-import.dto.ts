import { ApiProperty } from "@nestjs/swagger";
import { Allow } from "class-validator";

export class MultipleImportDto {
    @ApiProperty({ type: "string", format: "binary" })
    @Allow()
    file: string;

    @ApiProperty({ type: "string", enum: ["0", "1"] })
    force?: boolean;
}
