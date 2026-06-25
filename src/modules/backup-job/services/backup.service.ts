import { DatabaseType } from "@common/constant";
import { DatabaseConfigEntity } from "@module/database-config/entities/database-config.entity";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { executeOS } from "@common/utils/excuteos.utils";
@Injectable()
export class BackupService {
    constructor(private readonly configService: ConfigService) {}

    async backupDb(db: DatabaseConfigEntity) {
        if (!db) {
            throw new Error("backupDb received null/undefined db");
        }
        if (!db.type) {
            throw new Error("Database type is missing");
        }
        switch (db.type) {
            case DatabaseType.POSTGRES:
                return this.backupPostgresDb(db);

            case DatabaseType.MONGO:
                return this.backupMongoDb(db);

            default:
                throw new Error(`Unsupported database type: ${db.type}`);
        }
    }
    async backupPostgresDb(db: DatabaseConfigEntity) {
        const backupRoot = this.configService.get<string>("backup.rootPath");
        const pgDumpPath = this.configService.get<string>(
            "backup.postgresDumpPath",
        );

        const fileName = `${db.databaseName}_${Date.now()}.sql`;
        const filePath = `${backupRoot}/${fileName}`;

        const command =
            `"${pgDumpPath}" ` +
            `-U ${db.username} ` +
            `-h ${db.host} ` +
            `-p ${db.port} ` +
            `${db.databaseName} ` +
            `-f "${filePath}"`;

        const result = await executeOS(command, {
            PGPASSWORD: db.password,
        });
        console.log(`Backup completed: ${filePath}`);
        return {
            fileName,
            filePath,
            result,
        };
    }

    async backupMongoDb(db: DatabaseConfigEntity) {
        const backupRoot = this.configService.get<string>("backup.rootPath");

        const mongodumpPath = this.configService.get<string>(
            "backup.mongoDumpPath",
        );
        const fileName = `mongo_${db.databaseName}_${Date.now()}`;
        const filePath = `${backupRoot}/${fileName}`;

        const uri =
            `mongodb+srv://${db.username}:${db.password}` +
            `@${db.host}/${db.databaseName}`;

        const command =
            `"${mongodumpPath}" ` +
            `--uri="${uri}" ` +
            `--out="${filePath}" ` +
            `--gzip`;
        const result = await executeOS(command);
        console.log(`Backup completed: ${filePath}`);
        return {
            fileName,
            filePath,
            result,
        };
    }
}
