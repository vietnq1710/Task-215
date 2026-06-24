import { Configuration } from "@config/configuration";
import { TcpSocket } from "@config/tcp/tcp-socket";
import { Inject, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";

export const getTcpClientToken = (name: string) => `${name}TcpClient`;

export const TcpClients = ["local", "core"] as const;

export const TcpClientProviders = TcpClients.map(
    (name: string): Provider => ({
        provide: getTcpClientToken(name),
        inject: [ConfigService],
        useFactory: async (configService: ConfigService<Configuration>) => {
            const client = configService.get("microservice.tcp.client", {
                infer: true,
            })[name];
            if (!client) {
                throw new Error(`TCP client "${name}" not found`);
            }
            const clientProxy = ClientProxyFactory.create({
                transport: Transport.TCP,
                options: {
                    host: client.host,
                    port: client.port,
                    socketClass: TcpSocket,
                },
            });
            const apiKey = configService.get("server.gwApiKey", {
                infer: true,
            });
            const wrapData = <T>(data: T) => ({
                payload: data,
                auth: {
                    apiKey,
                },
            });
            const send = clientProxy.send.bind(clientProxy);
            const emit = clientProxy.emit.bind(clientProxy);
            clientProxy.send = ((pattern, data) =>
                send(pattern, wrapData(data))) as typeof clientProxy.send;
            clientProxy.emit = ((pattern, data) =>
                emit(pattern, wrapData(data))) as typeof clientProxy.emit;
            return clientProxy;
        },
    }),
);

export const InjectTcpClient = (name: (typeof TcpClients)[number]) =>
    Inject(getTcpClientToken(name));
