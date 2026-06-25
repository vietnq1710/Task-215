import { SqlRepository } from "@module/repository/sequelize/sql.repository";
import { BackupHistoryEntity } from "../entities/backup-history.entity";
import { BackuphistoryRepository } from "./backuphistory-repository.interface";
import { InjectModel } from "@nestjs/sequelize";
import { ModelCtor } from "sequelize-typescript";
import { BackupHistoryModel } from "../models/backup-history.models";

export class BackuphistorySqlRepository
    extends SqlRepository<BackupHistoryEntity>
    implements BackuphistoryRepository
{
    constructor(
        @InjectModel(BackupHistoryModel)
        private readonly backupHistoryModel: ModelCtor<BackupHistoryModel>,
    ) {
        super(backupHistoryModel);
    }
}
