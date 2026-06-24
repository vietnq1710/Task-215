import { IsOptional, IsString } from "class-validator";

export class UserConditionDto {
    @IsString()
    @IsOptional()
    username?: string;
}
