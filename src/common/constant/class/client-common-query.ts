import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class ClientCommonQuery {
    @IsOptional()
    @IsString()
    select?: string;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    page?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(200)
    @Type(() => Number)
    limit?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    skip?: string;

    @IsOptional()
    @IsString({ each: true })
    filters?: string[];

    @IsOptional()
    @IsString({ each: true })
    population?: string[];
}
