import { DatabaseType, StrObjectId } from "@common/constant";
import { Entity } from "@module/repository";
import { Column, Model, Table } from "sequelize-typescript";
import { DatabaseConfigEntity } from "../entities/database-config.entity";
@Table({ tableName: Entity.DATABASE_CONFIG })
export class DatabaseConfigModel extends Model implements DatabaseConfigEntity {
    @StrObjectId()
    _id: string;

    @Column({ unique: true, allowNull: false })
    name: string;

    @Column
    type: DatabaseType;

    @Column
    host: string;

    @Column
    port: number;

    @Column({ unique: true, allowNull: false })
    databaseName: string;

    @Column({ unique: true, allowNull: false })
    username: string;

    @Column({ unique: true, allowNull: false })
    password: string;
}
