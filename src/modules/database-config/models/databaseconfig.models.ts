import { DatabaseType, StrObjectId } from "@common/constant";
import { Entity } from "@module/repository";
import { Column, Model, Table } from "sequelize-typescript";
import { DatabaseConfigEntity } from "../entities/database-config.entity";
@Table({ tableName: Entity.DATABASE_CONFIG })
export class DatabaseConfigModel extends Model implements DatabaseConfigEntity {
    @StrObjectId()
    _id: string;

    @Column({ allowNull: false })
    name: string;

    @Column
    type: DatabaseType;

    @Column({ allowNull: false })
    host: string;

    @Column({ allowNull: false })
    port: number;

    @Column({ allowNull: false })
    databaseName: string;

    @Column({ allowNull: false })
    username: string;

    @Column({ allowNull: false })
    password: string;
}
