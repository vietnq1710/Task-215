import { PickType } from "@nestjs/swagger";
import { DatabaseConfigEntity } from "../entities/database-config.entity";

export class CreateDatabaseconfigDto extends PickType(DatabaseConfigEntity, [
    "_id",
]) {}
