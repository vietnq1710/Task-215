import { DatabaseType, StrObjectId } from "@common/constant";
import { BaseEntity } from "@common/interface/base-entity.interface";
import { IsEnum, IsNumber, IsString } from "class-validator";

export class DatabaseConfigEntity implements BaseEntity {
    @StrObjectId()
    _id: string;

    @IsString()
    name: string;

    @IsEnum(DatabaseType)
    type: DatabaseType;

    @IsString()
    host: string;

    @IsNumber()
    port: number;

    @IsString()
    databaseName: string;

    @IsString()
    username: string;

    @IsString()
    password: string;
}
