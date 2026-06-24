import { StrObjectId } from "@common/constant";
import { EntityDefinition } from "@common/constant/class/entity-definition";
import { IsYYYYMMDD } from "@common/decorator/validate.decorator";
import { BaseEntity } from "@common/interface/base-entity.interface";
import { Auth } from "@module/auth/entities/auth.entity";
import { Entity } from "@module/repository";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { HydratedDocument } from "mongoose";
import { Gender, SystemRole } from "../common/constant";

@Schema({
    collection: Entity.USER,
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
})
export class User implements BaseEntity {
    @StrObjectId()
    _id: string;

    /**
     * Username
     * @example username
     */
    @IsString({ message: "Tên đăng nhập phải là xâu ký tự" })
    @Prop({ required: true, unique: true, lowercase: true })
    @EntityDefinition.field({ label: "user.username", required: true })
    username: string;

    /**
     * Password
     * @example password
     */
    @IsString({ message: "Mật khẩu phải là xâu ký tự" })
    @IsOptional()
    @Prop()
    @EntityDefinition.field({ label: "user.password" })
    password?: string;

    @IsString()
    @IsOptional()
    @Prop({ unique: true, sparse: true })
    @EntityDefinition.field({ label: "user.ssoId" })
    ssoId?: string;

    @IsEmail({}, { message: "Email không đúng định dạng" })
    @Prop({ required: true })
    @EntityDefinition.field({ label: "user.email", required: true })
    email: string;

    @IsString()
    @IsOptional()
    @Prop()
    @EntityDefinition.field({ label: "user.firstname" })
    firstname?: string;

    @IsString()
    @IsOptional()
    @Prop()
    @EntityDefinition.field({ label: "user.lastname" })
    lastname?: string;

    @IsString()
    @IsOptional()
    @Prop()
    @EntityDefinition.field({ label: "user.fullname" })
    fullname?: string;

    @IsEnum(Gender)
    @IsOptional()
    @Prop({ type: String, enum: Object.values(Gender) })
    @EntityDefinition.field({
        label: "user.gender",
        enum: Object.values(Gender),
        example: Gender.FEMALE,
    })
    gender?: Gender;

    /**
     * Date of birth
     * @example 1999-12-31
     */
    @IsYYYYMMDD()
    @IsOptional()
    @Prop({ type: String, minlength: 10, maxlength: 10 })
    @EntityDefinition.field({ label: "user.dob" })
    dob?: string;

    @IsEnum(SystemRole)
    @Prop({
        required: true,
        enum: Object.values(SystemRole),
    })
    @EntityDefinition.field({
        label: "user.systemRole",
        enum: Object.values(SystemRole),
    })
    systemRole: SystemRole;

    @EntityDefinition.field({
        label: "Auth",
        disableImport: true,
        propertyTarget: Auth,
    })
    authList?: Auth[];

    @Prop({})
    dataPartitionCode?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual("authList", {
    ref: Entity.AUTH,
    localField: "_id",
    foreignField: "user",
});
