import { SqlRepository } from "@module/repository/sequelize/sql.repository";
import { InjectModel } from "@nestjs/sequelize";
import { ModelCtor } from "sequelize-typescript";
import { DatabaseConfigEntity } from "../entities/database-config.entity";
import { DatabaseConfigModel } from "../models/databaseconfig.models";
import { DatabaseconfigRepository } from "./databaseconfig-repository.interface";
export class DatabaseconfigSqlRepository
    extends SqlRepository<DatabaseConfigEntity>
    implements DatabaseconfigRepository
{
    constructor(
        @InjectModel(DatabaseConfigModel)
        private readonly databaseConfigModel: ModelCtor<DatabaseConfigModel>,
    ) {
        super(databaseConfigModel);
    }
}
