import { CreateDatabaseconfigDto } from "@module/database-config/dtos/create-databaseconfig.dto";
import { PartialType } from "@nestjs/swagger";
export class UpdateDatabaseconfigDto extends PartialType(
    CreateDatabaseconfigDto,
) {}
