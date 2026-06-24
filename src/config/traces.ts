import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
    BatchSpanProcessor,
    TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";

import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";

import { Logger } from "@nestjs/common";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { config } from "dotenv";
import { getEnv } from "./configuration";
config({ quiet: true });

let sdk: NodeSDK;

const initTracer = () => {
    try {
        const serviceName = getEnv("OTEL_SERVICE_NAME", "aisoft-backend");
        getEnv("OTEL_TRACES_EXPORTER", "otlp");
        const exporterOtlpEndpoint = getEnv("OTEL_EXPORTER_OTLP_ENDPOINT");
        const traceEndpoint = getEnv(
            "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
            `${exporterOtlpEndpoint}/v1/traces`,
        );
        const metricEndpoint = getEnv(
            "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
            `${exporterOtlpEndpoint}/v1/metrics`,
        );
        const ingestionKey = getEnv("OTEL_INGESTION_KEY");
        getEnv("OTEL_NODE_RESOURCE_DETECTORS", "env,host,os");

        const traceExporter = new OTLPTraceExporter({
            url: traceEndpoint,
            headers: { "signoz-ingestion-key": ingestionKey },
        });

        const metricReader = new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
                url: metricEndpoint,
                headers: { "signoz-ingestion-key": ingestionKey },
            }),
            exportIntervalMillis: 10000,
        });

        sdk = new NodeSDK({
            resource: resourceFromAttributes({
                [ATTR_SERVICE_NAME]: serviceName,
            }),
            // traceExporter,
            metricReader,

            contextManager: new AsyncLocalStorageContextManager(),
            instrumentations: [
                getNodeAutoInstrumentations({
                    "@opentelemetry/instrumentation-http": { enabled: true },
                    "@opentelemetry/instrumentation-nestjs-core": {
                        enabled: true,
                    }, // NEW! for NestJS services & interceptors
                    "@opentelemetry/instrumentation-pg": { enabled: true },
                    "@opentelemetry/instrumentation-mongodb": { enabled: true },
                }),
            ],
            autoDetectResources: false,
            serviceName,
            spanProcessor: new BatchSpanProcessor(traceExporter, {
                maxExportBatchSize: 200,
                exportTimeoutMillis: 5000,
                scheduledDelayMillis: 2000,
            }),
            sampler: new TraceIdRatioBasedSampler(0.25),
        });
    } catch (err) {
        Logger.error(`Error setting otel: ${err["message"]}`, "OpenTelemetry");
    }
    sdk.start();
};

export default initTracer;
