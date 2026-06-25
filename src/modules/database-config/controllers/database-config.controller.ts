import { BaseControllerFactory } from "@config/controller/base-controller-factory";
import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { DatabaseConfigEntity } from "../entities/database-config.entity";
import { DatabaseconfigService } from "../services/database-config.service";
import { CreateDatabaseconfigDto } from "../dtos/create-databaseconfig.dto";
import { UpdateDocument } from "@module/repository/common/base-repository.interface";
import { create } from "lodash";
import { UpdateDatabaseconfigDto } from "../dtos/update-databaseconfig.dto";

@Controller("database-config")
@ApiTags("database-config")
export class DatabaseconfigController extends BaseControllerFactory<DatabaseConfigEntity>(
    DatabaseConfigEntity,
    CreateDatabaseconfigDto,
    UpdateDatabaseconfigDto,
    null,
) {
    constructor(private readonly service: DatabaseconfigService) {
        super(service);
    }
}

/*
    null,
    null,
    null,
    {
        import: {
            enable: false,
        },
        routes: {
            create: {
                enable: true,
                document: {
                    operator: {
                        summary: "Create Database Config",
                        description: "Create a new database configuration",
                    },
                    response: { description: "Created database config" },
                },
                auditLog: {
                    enable: true,
                    logError: true,
                    logResponse: true,
                    sourceId: "response.data._id",
                },
            },

            getMany: {
                enable: true,
            },

            getById: {
                enable: true,
            },

            updateById: {
                enable: true,
            },

            deleteById: {
                enable: true,
            },
        },

        dataPartition: {
            enable: false,
        },
    },
) {
    constructor(private readonly service: DatabaseconfigService) {
        super(service);
    }

    @Post("create-manual")
    async createManual(@Body() dto: CreateDatabaseconfigDto) {
        return this.service.creatConfig(dto);
    }

    @Get("all")
    async findAll() {
        return this.service.findConfig();
    }

    @Get(":id")
    async findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    @Put(":id")
    async update(
        @Param("id") id: string,
        @Body() dto: UpdateDocument<DatabaseConfigEntity>,
    ) {
        return this.service.updateConfig(id, dto);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        return this.service.deleteConfig(id);
    }
        

}
    */
