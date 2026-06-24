import { Global, Module } from "@nestjs/common";
// import { LoggerModule } from "nestjs-pino";
import { BaseLoggerService } from "./base-logger.service";

@Global()
@Module({
    imports: [
        // LoggerModule.forRoot({
        //     pinoHttp: {
        //         transport: {
        //             targets: [
        //                 // 1. Ghi ra Console để debug khi dev
        //                 {
        //                     target: "pino-pretty",
        //                     options: { colorize: true },
        //                     level: "info",
        //                 },
        //                 // 2. Ghi ra file và cấu hình Rotate (1 tháng)
        //                 {
        //                     target: "pino-roll",
        //                     options: {
        //                         file: path.join(
        //                             __dirname,
        //                             "..",
        //                             "logs",
        //                             "app.log",
        //                         ),
        //                         frequency: "daily", // Kiểm tra mỗi ngày
        //                         limit: {
        //                             count: 30, // Giữ tối đa 30 file (tương đương 1 tháng)
        //                         },
        //                         mkdir: true,
        //                     },
        //                     level: "info",
        //                 },
        //             ],
        //         },
        //     },
        // }),
    ],
    providers: [BaseLoggerService],
    exports: [BaseLoggerService],
})
export class BaseLoggerModule {}
