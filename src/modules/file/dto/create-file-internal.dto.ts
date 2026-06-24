import { User } from "@module/user/entities/user.entity";
import { IsString } from "class-validator";
import { CreateFileDto } from "./create-file.dto";

export class CreateFileInternalDto extends CreateFileDto {
    @IsString()
    user: string | User;
}
