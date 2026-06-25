import { InjectRepository } from "@module/repository/common/repository";
import { Entity } from "@module/repository";
import { DatabaseconfigSqlRepository } from "../repositories/databaseconfig-sql-repository";
import { DatabaseConfigEntity } from "../entities/database-config.entity";
import { CreateDatabaseconfigDto } from "../dtos/create-databaseconfig.dto";
import { UpdateDocument } from "@module/repository/common/base-repository.interface";
import { BaseService } from "@config/service/base.service";
export class DatabaseconfigService extends BaseService<
    DatabaseConfigEntity,
    DatabaseconfigSqlRepository
> {
    constructor(
        @InjectRepository(Entity.DATABASE_CONFIG)
        private readonly Repo: DatabaseconfigSqlRepository,
    ) {
        super(Repo);
    }
    /*
    async creatConfig(dto: CreateDatabaseconfigDto) {
        return this.Repo.create(dto);
    }

    async findConfig() {
        return this.Repo.getMany({});
    }

    async findOne(id: string) {
        return this.Repo.getById(id, {});
    }

    async updateConfig(
        id: string,
        update: UpdateDocument<DatabaseConfigEntity>,
    ) {
        return this.Repo.updateById(id, update, {});
    }

    async deleteConfig(id: string) {
        return this.Repo.deleteById(id);
    }
        */
}
