import { ApiRecordResponse } from "@common/decorator/api.decorator";
import { Authorization, ReqUser } from "@common/decorator/auth.decorator";
import { UploadFile } from "@common/decorator/file.decorator";
import { User } from "@module/user/entities/user.entity";
import {
    Body,
    Controller,
    Delete,
    Param,
    Post,
    Req,
    UploadedFile,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ClientCompleteMultipartUploadDto } from "./dto/client-complete-multipart-upload.dto";
import { ClientInitMultipartUploadDto } from "./dto/client-init-multipart-upload.dto";
import { CreateFileResponseDto } from "./dto/create-file-response.dto";
import { CreateFileDto } from "./dto/create-file.dto";
import { File } from "./entities/file.entity";
import { FileService } from "./file.service";
import { FileUploadTransform } from "./pipe/file-upload-transform.pipe";

@Controller("file")
@ApiTags("file")
@Authorization()
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post("multipart/init")
    async initUploadMultipart(
        @ReqUser() user: User,
        @Body() body: ClientInitMultipartUploadDto,
    ) {
        return this.fileService.initiateMultipartUpload(user, body);
    }

    @Post("multipart/complete")
    async completeUploadMultipart(
        @ReqUser() user: User,
        @Body() body: ClientCompleteMultipartUploadDto,
    ) {
        return this.fileService.clientCompleteMultipartUpload(user, body);
    }

    @Post()
    @ApiConsumes("multipart/form-data")
    @UploadFile()
    @ApiRecordResponse(CreateFileResponseDto)
    @ApiBody({ type: CreateFileDto })
    async create(
        @ReqUser() user: User,
        @Body(FileUploadTransform) dto: CreateFileDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
    ) {
        const data = await this.fileService.create(user, dto, file, {
            headers: req.headers,
        });
        return data;
    }

    @Delete(":id")
    @ApiRecordResponse(File)
    async deleteById(@ReqUser() user: User, @Param("id") id: string) {
        await this.fileService.deleteById(user, id);
    }

    @Post("compress/files")
    async compressFiles() {
        await this.fileService.compressFiles();
    }

    @Post("upsert/internal")
    async upsertInternal() {}
}
