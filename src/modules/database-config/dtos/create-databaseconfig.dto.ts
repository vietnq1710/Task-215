import { OmitType } from "@nestjs/swagger";
import { DatabaseConfigEntity } from "../entities/database-config.entity";

export class CreateDatabaseconfigDto extends OmitType(DatabaseConfigEntity, [
    "_id",
]) {}
