import { Injectable, PipeTransform } from "@nestjs/common";

type TcpPayloadEnvelope = {
    payload: unknown;
    auth: {
        apiKey?: string;
    };
};

@Injectable()
export class TcpPayloadTransformPipe implements PipeTransform {
    transform(value: unknown) {
        if (!this.isTcpPayloadEnvelope(value)) {
            return value;
        }
        return value.payload;
    }

    private isTcpPayloadEnvelope(value: unknown): value is TcpPayloadEnvelope {
        if (!value || typeof value !== "object") {
            return false;
        }
        const data = value as Partial<TcpPayloadEnvelope>;
        return (
            Object.prototype.hasOwnProperty.call(data, "payload") &&
            Object.prototype.hasOwnProperty.call(data, "auth")
        );
    }
}
