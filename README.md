[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# A.I-Soft Backend

NestJS backend framework hỗ trợ đa cơ sở dữ liệu (MongoDB + PostgreSQL), microservices (gRPC, TCP, RabbitMQ), lưu trữ file (MinIO), xác thực JWT/SSO, và nhiều tính năng enterprise khác.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt](#2-cài-đặt)
3. [Cấu hình môi trường (.env)](#3-cấu-hình-môi-trường-env)
4. [Khởi động dịch vụ hạ tầng (Docker)](#4-khởi-động-dịch-vụ-hạ-tầng-docker)
5. [Chạy ứng dụng](#5-chạy-ứng-dụng)
6. [Build & Deploy](#6-build--deploy)
7. [Test](#7-test)
8. [Cấu trúc thư mục](#8-cấu-trúc-thư-mục)
9. [Kiến trúc hệ thống](#9-kiến-trúc-hệ-thống)
10. [Các module chính](#10-các-module-chính)
11. [Cơ sở dữ liệu & Sequelize](#11-cơ-sở-dữ-liệu--sequelize)
12. [CLI nội bộ (aisoft)](#12-cli-nội-bộ-aisoft)
13. [API Documentation (Swagger)](#13-api-documentation-swagger)
14. [Observability & Tracing](#14-observability--tracing)
15. [Quy trình Commit (Commitizen)](#15-quy-trình-commit-commitizen)

---

## 1. Yêu cầu hệ thống

| Công nghệ      | Phiên bản tối thiểu |
| -------------- | ------------------- |
| Node.js        | 22+                 |
| npm            | 9+                  |
| Docker         | 20+                 |
| PostgreSQL     | 15+                 |
| MongoDB        | 6+ (replica set)    |
| Redis          | 6.2+                |
| MinIO          | latest              |

---

## 2. Cài đặt

```bash
# Clone repository
git clone <repo-url>
cd aisoft-backend

# Cài đặt dependencies
npm install

# Đăng ký CLI nội bộ (tuỳ chọn)
npm run aisoft
```

---

## 3. Cấu hình môi trường (.env)

Sao chép file mẫu và chỉnh sửa theo môi trường:

```bash
cp example.env .env
```

### Tất cả biến môi trường

#### Server

| Biến                  | Mô tả                                    | Ví dụ                        |
| --------------------- | ---------------------------------------- | ---------------------------- |
| `SERVER_ADDRESS`      | Địa chỉ công khai của server             | `http://localhost:3000`      |
| `SERVER_ENV`          | Môi trường (`development`/`production`)  | `development`                |
| `SERVER_PORT`         | Cổng lắng nghe HTTP                      | `3000`                       |

#### JWT

| Biến                   | Mô tả                            | Ví dụ            |
| ---------------------- | -------------------------------- | ---------------- |
| `JWT_SECRET`           | Secret key cho access token      | `deep_secret`    |
| `JWT_EXP`              | Thời gian hết hạn (giây)         | `3600`           |
| `JWT_REFRESH_SECRET`   | Secret key cho refresh token     | `deep_secret`    |
| `JWT_REFRESH_EXP`      | Thời gian hết hạn refresh (giây) | `15552000`       |

#### MongoDB

| Biến           | Mô tả                                           | Ví dụ                                            |
| -------------- | ----------------------------------------------- | ------------------------------------------------ |
| `DB_URI`       | URI kết nối MongoDB (cần replica set)           | `mongodb://localhost:27017/aisoft?replicaSet=rs0` |
| `MONGODB_URI`  | Alias của `DB_URI`                              | *(như trên)*                                     |
| `MONGODB_TLS`  | Bật TLS (`1`/`0`)                               | `0`                                              |
| `MONGODB_TLS_CA_FILE` | Đường dẫn CA certificate                | `/app/certs/global-bundle.pem`                   |

> **Lưu ý:** MongoDB phải chạy ở chế độ **Replica Set** vì hệ thống sử dụng transactions.

#### PostgreSQL (Sequelize)

| Biến           | Mô tả                         | Ví dụ      |
| -------------- | ----------------------------- | ---------- |
| `SQL_TYPE`     | Loại database                 | `postgres` |
| `SQL_HOST`     | Host PostgreSQL                | `localhost` |
| `SQL_PORT`     | Cổng PostgreSQL               | `5432`     |
| `SQL_USER`     | Tên user                      | `aisoft`   |
| `SQL_PASSWORD` | Mật khẩu                      | `aisoft`   |
| `SQL_DB`       | Tên database                  | `aisoft`   |
| `SQL_SCHEMA`   | Schema                        | `public`   |
| `SQL_USE_SSL`  | Bật SSL (`1`/`0`)             | `0`        |
| `SQL_SSL_REJECT_UNAUTHORIZED` | Xác thực CA server SSL (`1`/`0`) | `0` |

#### Redis

| Biến             | Mô tả           | Ví dụ      |
| ---------------- | --------------- | ---------- |
| `REDIS_HOST`     | Host Redis      | `localhost` |
| `REDIS_PORT`     | Cổng Redis      | `6379`     |
| `REDIS_PASSWORD` | Mật khẩu Redis  | `password` |
| `REDIS_TLS`      | Bật TLS (`1`/`0`) | `0`      |
| `REDIS_TLS_REJECT_UNAUTHORIZED` | Xác thực CA server TLS (`1`/`0`) | `0` |

#### MinIO (Object Storage)

| Biến                       | Mô tả                                    | Ví dụ          |
| -------------------------- | ---------------------------------------- | -------------- |
| `MINIO_ENDPOINT`           | Host MinIO                               | `localhost`    |
| `MINIO_PORT`               | Cổng MinIO                               | `9000`         |
| `MINIO_USE_SSL`            | Bật SSL (`1`/`0`)                        | `0`            |
| `MINIO_ACCESS_KEY`         | Access key                               | `minioadmin`   |
| `MINIO_SECRET_KEY`         | Secret key                               | `minioadmin`   |
| `MINIO_REGION`             | Region                                   | `ap-southeast-1` |
| `MINIO_BUCKET`             | Tên bucket mặc định                      | `aisoft`       |
| `MINIO_MULTIPART_PART_SIZE`| Kích thước mỗi part khi upload multipart | `16777216`     |

#### Microservices

| Biến                        | Mô tả                        | Ví dụ                            |
| --------------------------- | ---------------------------- | -------------------------------- |
| `MICROSERVICE_RABBITMQ_URL` | URL kết nối RabbitMQ         | `amqp://user:password@localhost` |
| `MICROSERVICE_GRPC_PORT`    | Cổng gRPC server             | `3001`                           |

#### SSO (Keycloak)

| Biến            | Mô tả                        | Ví dụ                                                                        |
| --------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `SSO_JWKS_URI`  | URI lấy JWKS từ Keycloak     | `https://ais.aisenote.com/keycloak/realms/master/protocol/openid-connect/certs` |

#### OneSignal (Push Notification)

| Biến                 | Mô tả           | Ví dụ    |
| -------------------- | --------------- | -------- |
| `ONE_SIGNAL_APP_ID`  | App ID          | `app_id` |
| `ONE_SIGNAL_API_KEY` | API Key         | `api_key` |

#### Loki (Logging)

| Biến                  | Mô tả                    | Ví dụ                     |
| --------------------- | ------------------------ | ------------------------- |
| `LOKI_ENABLED`        | Bật Loki (`1`/`0`)       | `0`                       |
| `LOKI_URL`            | URL Loki                 | `http://localhost:3100`   |
| `LOKI_SERVICE_NAME`   | Tên service trong Loki   | `aisoft-backend`          |

#### OpenTelemetry (Tracing)

| Biến                            | Mô tả                         |
| ------------------------------- | ----------------------------- |
| `OTEL_ENABLED`                  | Bật OpenTelemetry (`1`/`0`)   |
| `OTEL_SERVICE_NAME`             | Tên service                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | Endpoint OTLP collector       |
| `OTEL_INGESTION_KEY`            | Ingestion key (SigNoz, v.v.)  |

---

## 4. Khởi động dịch vụ hạ tầng (Docker)

File `docker-compose.yml` cung cấp sẵn PostgreSQL và Redis.

```bash
# Khởi động PostgreSQL
docker compose up -d postgresql

# Khởi động Redis
docker compose up -d redis

# Khởi động tất cả
docker compose up -d
```

> Dữ liệu PostgreSQL được persist tại `./docker/postgres/`, Redis tại `./docker/redis/`.

### Thiết lập PostgreSQL thủ công

```sql
-- Tạo database
CREATE DATABASE aisoft;

-- Tạo user
CREATE USER aisoft WITH ENCRYPTED PASSWORD 'aisoft';
GRANT ALL PRIVILEGES ON DATABASE aisoft TO aisoft;

-- Đăng nhập và tạo schema
psql -U aisoft --password
CREATE SCHEMA public;
```

---

## 5. Chạy ứng dụng

```bash
# Development (không watch)
npm run start

# Development với hot-reload
npm run start:dev

# Debug mode
npm run start:debug

# Production
npm run start:prod
```

Sau khi khởi động, ứng dụng lắng nghe đồng thời:
- **HTTP API**: `http://localhost:3000`
- **gRPC**: cổng `3001` (mặc định)
- **TCP Microservice**: cổng cấu hình trong `.env`

---

## 6. Build & Deploy

### Build thông thường

```bash
npm run build
```

Output tại `./dist/`.

### Build obfuscated (production bundle)

```bash
npm run build-bundle
```

Output được mã hoá bằng `javascript-obfuscator` và đặt vào `./dist/`.

### Docker Image

```bash
# Build image
docker build -t aisoft-backend .

# Chạy container
docker run -p 3000:3000 --env-file .env aisoft-backend
```

**Dockerfile sử dụng multi-stage build:**
1. **Stage `builder`** (Node 22 Alpine): Cài full dependencies, build/obfuscate TypeScript → `dist/`.
2. **Stage production** (Node 22 Alpine): Chỉ copy `dist/`, cài production dependencies, chạy dưới user `node` (non-root).

---

## 7. Test

```bash
# Unit tests
npm run test

# Unit tests với watch
npm run test:watch

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

Cấu hình Jest E2E: [`test/jest-e2e.json`](test/jest-e2e.json).

---

## 8. Cấu trúc thư mục

```
aisoft-backend/
│
├── src/                          # Mã nguồn chính
│   ├── main.ts                   # Entry point, bootstrap NestJS app
│   ├── app.module.ts             # Root module, import tất cả modules
│   ├── app.controller.ts         # Controller gốc (health ping)
│   │
│   ├── config/                   # Cấu hình toàn cục
│   │   ├── configuration.ts      # Load & type toàn bộ env vars
│   │   ├── traces.ts             # Khởi tạo OpenTelemetry SDK
│   │   ├── module/               # DefaultModules, DefaultProviders
│   │   ├── controller/           # Config controllers
│   │   ├── exception/            # Global exception filters
│   │   ├── service/              # Config services
│   │   └── tcp/                  # TCP microservice config
│   │
│   ├── common/                   # Shared utilities dùng trong toàn dự án
│   │   ├── constant/             # Enums, constants, type definitions
│   │   ├── decorator/            # Custom decorators (Auth, Route, File, v.v.)
│   │   ├── dto/                  # Base DTOs dùng chung
│   │   ├── guard/                # Guards (JWT, SSO, DataPartition, SystemRole)
│   │   ├── i18n/                 # File ngôn ngữ (vi/, en/)
│   │   ├── interceptor/          # Interceptors (TransformResponse, FileType)
│   │   ├── interface/            # Interfaces dùng chung
│   │   ├── pipe/                 # Validation & transform pipes
│   │   ├── provider/             # Shared providers
│   │   └── utils/                # Utility functions (mongo, ...)
│   │
│   ├── cron-manager/             # Quản lý cron jobs phân tán qua Redis
│   │   ├── cron-manager.module.ts
│   │   └── cron-manager.service.ts
│   │
│   └── modules/                  # Feature modules
│       ├── audit-log/            # Ghi log thao tác người dùng
│       ├── auth/                 # Xác thực (JWT login, refresh token)
│       ├── base-logger/          # Base logging module
        ├── co-cau-to-chuc/       # Cơ cấu tổ chức (placeholder, chưa triển khai)
        ├── common-provider/      # Shared providers cho nhiều modules (bọc DataPartition)
│       ├── core/                 # Core module
│       ├── data-partition/       # Phân vùng dữ liệu (multi-tenant)
        ├── data-process/         # Xử lý & chuyển đổi dữ liệu hàng loạt (replace domain URL)
│       ├── file/                 # Upload/download file qua MinIO
│       ├── health/               # Health check endpoint
        ├── import-session/       # Entity theo dõi trạng thái phiên import hàng loạt
│       ├── increment/            # Auto-increment ID
│       ├── internal-http/        # HTTP client nội bộ giữa các service
│       ├── microservice/         # Giao tiếp microservice
│       │   ├── grpc/             # gRPC client/server + .proto files
│       │   ├── rabbitmq/         # RabbitMQ consumer/producer
│       │   └── tcp/              # TCP transport
│       ├── minio/                # MinIO client service
│       ├── notification/         # Thông báo nội bộ
│       ├── one-signal/           # Push notification qua OneSignal
│       ├── quy-tac-ma/           # Quy tắc sinh mã tự động
│       ├── redis/                # Redis client module
│       ├── repository/           # Abstraction layer database
│       │   ├── mongo/            # Mongoose repositories
│       │   ├── sequelize/        # Sequelize repositories
│       │   └── common/           # Repository & Transaction interfaces
│       ├── setting/              # Cài đặt hệ thống
│       ├── sso/                  # SSO integration (Keycloak JWKS)
        ├── topic/                # Pub/Sub topic: đăng ký/huỷ đăng ký thông báo
│       └── user/                 # Quản lý người dùng
│
├── lib/                          # Thư viện nội bộ
│   └── @aisoft/
│       └── cli/                  # CLI tool `aisoft`
│           ├── bin/aisoft.js     # Entrypoint CLI
│           ├── index.ts          # Dispatcher lệnh
│           ├── type.ts           # CliCommand enum
│           ├── util.ts           # Logging utilities
│           └── base-generate/    # Code generator (module, entity, v.v.)
│
├── sequelize/                    # Cấu hình Sequelize CLI
│   ├── config/config.js          # DB config đọc từ env
│   ├── migrations/               # Migration files
│   ├── models/                   # Model definitions (CLI)
│   └── seeders/                  # Seeder files
│
├── docker/                       # Volume data cho Docker
│   ├── postgres/                 # Dữ liệu PostgreSQL persist
│   └── redis/                    # Dữ liệu Redis persist
│
├── test/                         # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .sequelizerc                  # Cấu hình đường dẫn cho sequelize-cli
├── nest-cli.json                 # NestJS CLI config (assets, plugins)
├── tsconfig.json                 # TypeScript config (path aliases)
├── tsconfig.build.json           # TypeScript config cho build
├── eslint.config.mjs             # ESLint config
├── commitlint.config.js          # Commitlint (conventional commits)
├── docker-compose.yml            # Docker services (PostgreSQL, Redis)
├── Dockerfile                    # Multi-stage Docker build
└── example.env                   # Mẫu file .env
```

---

## 9. Kiến trúc hệ thống

### Path Aliases (tsconfig)

| Alias        | Ánh xạ tới        |
| ------------ | ----------------- |
| `@common/*`  | `src/common/*`    |
| `@config/*`  | `src/config/*`    |
| `@module/*`  | `src/modules/*`   |

### Lớp cơ sở dữ liệu

Hệ thống hỗ trợ song song hai database:

```
MongoDB (Mongoose)         PostgreSQL (Sequelize)
       │                          │
  MongooseModule            SequelizeModule
       │                          │
  mongo/mongo.repository    sequelize/sql.repository
       └──────────┬───────────────┘
                  │
          RepositoryModule
          (abstraction layer)
```

### Luồng xác thực

```
Request
  │
  ├─ JWT Guard (JwtAuthGuard)       ← Bearer token
  ├─ SSO Guard (JwtSsoGuard)        ← Keycloak JWKS
  ├─ SystemRole Guard               ← Kiểm tra quyền hệ thống
  └─ DataPartition Guard            ← Kiểm tra phân vùng dữ liệu (multi-tenant)
```

### Transport Microservices

| Transport   | Mô tả                                           |
| ----------- | ----------------------------------------------- |
| **gRPC**    | Giao tiếp hiệu suất cao, định nghĩa qua `.proto` |
| **TCP**     | Transport mặc định NestJS microservices          |
| **RabbitMQ**| Message queue, event-driven communication         |

### Queue (Bull + Redis)

Sử dụng `@nestjs/bull` với Redis làm backend để xử lý các tác vụ bất đồng bộ:
- `OneSignal` queue: Gửi push notification
- `AuditLog` queue: Ghi log thao tác

### Cron Manager

`CronManagerService` sử dụng Redis để đảm bảo chỉ **một instance** chạy cron job tại một thời điểm trong môi trường multi-instance:

```typescript
if (await cronManager.isCronLeader(MyService, 'myJob')) {
    // Chỉ leader mới thực thi
}
```

Bật/tắt cron server qua biến môi trường `SERVER_CRON=1`.

---

## 10. Các module chính

### `auth`
- Đăng nhập / đăng xuất / refresh token (JWT).
- Chiến lược: `passport-jwt` (`JwtStrategy`).
- Repository: `AuthMongoRepository`, `AuthSqlRepository`.

### `user`
- CRUD người dùng, phân quyền `SystemRole`.
- Hỗ trợ data partition (multi-tenant).
- Hỗ trợ bulk import người dùng từ file Excel.

### `file`
- Upload file qua Multer → lưu MinIO.
- Hỗ trợ kiểm tra MIME type (`FileTypeInterceptor`).
- Ba controller: public, internal, và authenticated.

### `repository`
- **Abstraction layer** giữa business logic và database driver.
- `RepositoryProvider(entity, ImplementationClass)` — đăng ký repository theo entity token.
- `TransactionProvider(TransactionClass)` — đăng ký transaction manager.

### `microservice`
- **gRPC**: định nghĩa service qua `.proto` trong `grpc/proto/`.
- **TCP**: `TcpClients` enum liệt kê các client (cấu hình trong `.env`).
- **RabbitMQ**: `@golevelup/nestjs-rabbitmq`.

### `data-partition`
- Hỗ trợ kiến trúc multi-tenant: mỗi request mang header `x-data-partition-code`.
- Guard `DataPartitionGuard` kiểm tra và inject partition vào CLS context.

### `sso`
- Xác thực token Keycloak qua JWKS endpoint (`SSO_JWKS_URI`).
- Sử dụng thư viện `jose` để verify JWT.

### `notification` & `one-signal`
- Gửi thông báo push qua OneSignal API.
- Xử lý bất đồng bộ qua Bull queue.

### `audit-log`
- Ghi lại mọi thao tác CUD (Create/Update/Delete) qua interceptor + queue.

### `quy-tac-ma`
- Engine sinh mã định danh tự động theo quy tắc cấu hình.

### `setting`
- Lưu trữ cài đặt hệ thống động trong database.

### `data-process`
- Cung cấp API nội bộ để xử lý và chuyển đổi dữ liệu hàng loạt.
- Hỗ trợ thao tác replace domain URL trực tiếp trên MongoDB và PostgreSQL.
- Chỉ cho phép vai trò `QUAN_TRI_VIEN` (SSO Admin) truy cập.

### `common-provider`
- Cung cấp `CommonProviderService` dùng chung giữa nhiều module.
- Bọc `DataPartitionInternalService` để đơn giản hoá kiểm tra trạng thái data partition (enable/disable).

### `increment`
- Cung cấp sequence/auto-increment an toàn trong MongoDB.

### `internal-http`
- HTTP client dùng `@nestjs/axios` để giao tiếp nội bộ giữa các service.
- Cấu hình qua `InternalHttpClients` enum.

---

## 11. Cơ sở dữ liệu & Sequelize

### Kiến trúc `.sequelizerc`

File `.sequelizerc` ánh xạ đường dẫn chuẩn cho `sequelize-cli`:

```
sequelize/
├── config/config.js      ← Cấu hình DB (đọc từ .env)
├── migrations/           ← Migration files
├── models/               ← Model definitions
└── seeders/              ← Seeder files
```

### Thiết lập Sequelize CLI

```bash
# Cài đặt global (nếu chưa có)
npm i -g sequelize-cli
```

### Tạo migration mới

```bash
# Tạo model + migration
sequelize-cli model:generate --name ModelName \
  --attributes field1:string,field2:integer

# Chỉ tạo migration (không tạo model)
sequelize-cli migration:create --name ten-thay-doi
```

> Sau khi tạo migration, chỉnh sửa file để đặt đúng kiểu dữ liệu, primary key `_id`, schema, v.v.

### Chạy migration

```bash
# Migrate lên phiên bản mới nhất
sequelize-cli db:migrate

# Rollback migration gần nhất
sequelize-cli db:migrate:undo

# Rollback tất cả
sequelize-cli db:migrate:undo:all
```

### Chạy seeder

```bash
# Chạy tất cả seeders
sequelize-cli db:seed:all

# Chạy seeder cụ thể
sequelize-cli db:seed --seed ten-seeder

# Undo seeder
sequelize-cli db:seed:undo:all
```

### Cấu hình SSL PostgreSQL

Trong `.env`, đặt `SQL_USE_SSL=1` để bật kết nối SSL.  
`SQL_SSL_REJECT_UNAUTHORIZED` mặc định là `0` (false), có thể đặt `1` khi cần bắt buộc xác thực CA.
Config `config.js` sẽ tự động thêm `{ ssl: { require: true, rejectUnauthorized: <theo env> } }`.

---

## 12. CLI nội bộ (aisoft)

CLI được đóng gói tại `lib/@aisoft/cli/` và đăng ký qua `npm link`:

```bash
npm run aisoft   # = npm link
```

### Sử dụng

```bash
# Sinh boilerplate cho một module mới
aisoft base <TenEntity> <loai-repository>
```

| Tham số            | Mô tả                                  |
| ------------------ | -------------------------------------- |
| `<TenEntity>`      | Tên entity (PascalCase, ví dụ: `Order`) |
| `<loai-repository>` | `mongo` hoặc `sql` (default)              |

**CLI sẽ tự động tạo:**
- Thư mục module với cấu trúc chuẩn (`module`, `entity`, `dto`, `service`, `controller`, `repository`)
- Import tự động vào `src/app.module.ts`

---

## 13. API Documentation (Swagger)

Swagger UI được tích hợp sẵn và khởi động cùng app:

| Endpoint       | Mô tả                              |
| -------------- | ---------------------------------- |
| `/docs`        | Swagger UI chính (public + auth API) |
| `/docs/internal` | Swagger UI internal API          |

### Xác thực trong Swagger

| Security Scheme    | Header / Param              | Mô tả                           |
| ------------------ | --------------------------- | --------------------------------|
| `Bearer`           | `Authorization: Bearer ...` | JWT access token                |
| `dataPartitionCode`| `x-data-partition-code`     | Multi-tenant partition code     |
| `apiKey`           | `x-api-key`                 | API key ở API Gateway  |
| `gwApiKey`         | `x-gw-api-key`              | API key truyền từ API Gateway         |

---

## 14. Observability & Tracing

### OpenTelemetry

Tracing được khởi tạo trước khi NestJS bootstrap (trong `main.ts`):

```bash
# Bật tracing trong .env
OTEL_ENABLED=1
OTEL_SERVICE_NAME=aisoft-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz-collector:4318
OTEL_INGESTION_KEY=your-key
```

Hỗ trợ export traces và metrics tới bất kỳ OTLP-compatible backend (SigNoz, Jaeger, Tempo, v.v.).

## 15. Quy trình Commit (Commitizen)

Dự án áp dụng **Conventional Commits** kiểm soát bởi `commitlint` + `husky`.

### Commit thủ công

Format: `<type>(<scope>): <description>`

```bash
git commit -m "feat(user): add profile update endpoint"
git commit -m "fix(auth): handle expired refresh token"
git commit -m "chore: update dependencies"
```

### Commit có hỗ trợ interactive (Commitizen)

```bash
git add .
git cz
```

### Các type hợp lệ

| Type       | Mô tả                              |
| ---------- | ---------------------------------- |
| `feat`     | Tính năng mới                      |
| `fix`      | Sửa lỗi                            |
| `docs`     | Chỉ thay đổi tài liệu              |
| `style`    | Format, không thay đổi logic       |
| `refactor` | Refactor, không fix bug / add feat |
| `test`     | Thêm hoặc sửa test                 |
| `chore`    | Build process, dependencies, v.v.  |
| `perf`     | Cải thiện hiệu năng                |