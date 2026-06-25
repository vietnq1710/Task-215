import { BaseRepository } from "@module/repository/common/base-repository.interface";
import { DatabaseConfigEntity } from "../entities/database-config.entity";

export interface DatabaseconfigRepository extends BaseRepository<DatabaseConfigEntity> {}
