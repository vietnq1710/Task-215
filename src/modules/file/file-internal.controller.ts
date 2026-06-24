import { ApiRecordResponse } from "@common/decorator/api.decorator";
import { Authorization, ReqUser } from "@common/decorator/auth.decorator";
import { UploadFile } from "@common/decorator/file.decorator";
import { InternalController } from "@common/decorator/route.decorator";
import { User } from "@module/user/entities/user.entity";
import {
    Body,
    Get,
    Next,
    Param,
    Post,
    Put,
    Req,
    Res,
    UploadedFile,
} from "@nestjs/common";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { NextFunction, Request, Response } from "express";
import { CreateFileInternalDto } from "./dto/create-file-internal.dto";
import { CreateFileResponseDto } from "./dto/create-file-response.dto";
import { CreateFileDto } from "./dto/create-file.dto";
import { File } from "./entities/file.entity";
import { FileService } from "./file.service";
import { FileUploadInternalTransform } from "./pipe/file-upload-internal-transform.pipe";
import { FileUploadTransform } from "./pipe/file-upload-transform.pipe";

@InternalController("file")
export class FileInternalController {
    constructor(private readonly fileService: FileService) {}

    @Post()
    @ApiConsumes("multipart/form-data")
    @UploadFile()
    @ApiRecordResponse(CreateFileResponseDto)
    @ApiBody({ type: CreateFileDto })
    @Authorization()
    async create(
        @ReqUser() user: User,
        @Body(FileUploadTransform) dto: CreateFileDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const data = await this.fileService.create(user, dto, file);
        return data;
    }

    @Get(":id/data")
    async getFileData(
        @Param("id") id: string,
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction,
    ) {
        return this.fileService.getFileData(null, id, req, res, next);
    }

    @Put(":id/data")
    @ApiConsumes("multipart/form-data")
    @UploadFile()
    @ApiRecordResponse(CreateFileResponseDto)
    @ApiBody({ type: CreateFileInternalDto })
    async updateDataById(
        @Param("id") id: string,
        @Body(FileUploadInternalTransform) dto: CreateFileInternalDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const { user } = dto;
        const data = await this.fileService.updateFileData(
            id,
            user as User,
            file,
            {
                transaction: undefined,
            },
        );
        return data;
    }

    @Post("migrate/db/s3")
    async migrateDbToS3() {
        return this.fileService.migrateDbToS3();
    }

    @Put(":id/upsert")
    async upsertById(@Param("id") id: string, @Body() dto: File) {
        return this.fileService.upsertById(id, dto);
    }
}
