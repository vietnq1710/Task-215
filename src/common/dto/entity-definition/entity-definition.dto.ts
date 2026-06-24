import { ApiHideProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class EntityDefinitionDto {
    field: string;
    label: string;
    enum?: Array<string | number | boolean>;
    key?: boolean;
    @ApiHideProperty()
    propertyTarget?: any;
    @ApiHideProperty()
    propertyTargetGetter?: () => any;
    type: any;
    required?: boolean;
    example?: string | number | boolean;
    disableImport?: boolean;
    disableExport?: boolean;
    object?: boolean;
    order?: number;

    @ApiHideProperty()
    definePropertyTarget?: boolean;

    @IsBoolean()
    @IsOptional()
    hasMany?: boolean;

    @IsBoolean()
    @IsOptional()
    hidden?: boolean;
}
