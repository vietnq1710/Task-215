import { Type } from "@nestjs/common";
import { SettingFileStorage } from "../entities/value/setting-file-storage.entity";
import { SettingFileUpload } from "../entities/value/setting-file-upload.entity";
import { SettingInitData } from "../entities/value/setting-init-data.entity";
import { SettingServer } from "../entities/value/setting-server.entity";

export enum SettingKey {
    INIT_DATA = "INIT_DATA",
    FILE_STORAGE = "FILE_STORAGE",
    SERVER = "SERVER",
    FILE_UPLOAD = "FILE_UPLOAD",
}

export const MAP_SETTING_ENTITY: { [key in SettingKey]?: Type<unknown> } = {
    [SettingKey.INIT_DATA]: SettingInitData,
    [SettingKey.FILE_STORAGE]: SettingFileStorage,
    [SettingKey.SERVER]: SettingServer,
    [SettingKey.FILE_UPLOAD]: SettingFileUpload,
};

export type SettingValue<T> = T extends SettingKey.INIT_DATA
    ? SettingInitData
    : T extends SettingKey.FILE_STORAGE
      ? SettingFileStorage
      : T extends SettingKey.SERVER
        ? SettingServer
        : T extends SettingKey.FILE_UPLOAD
          ? SettingFileUpload
          : Record<string, unknown>;
