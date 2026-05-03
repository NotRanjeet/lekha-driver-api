# Driver Portal API — Migration Plan

This document describes a **phased, step-by-step** approach to extracting the
driver portal into a standalone NestJS service (`driver-portal-api`).

Each phase is self-contained and can be reviewed/deployed independently.

---

## Phase 0 — Preparation & Scaffolding

### Goal
Bootstrap the new repository/workspace so subsequent phases have a solid foundation.

### Tasks

#### 0.1 — Create new repository or monorepo workspace
- If using a monorepo (e.g. Turborepo / Nx): add a new `apps/driver-portal-api` workspace.
- If using a separate repo: create `driver-portal-api` using the NestJS CLI.

```bash
# Standalone repo approach
npm i -g @nestjs/cli
nest new driver-portal-api
cd driver-portal-api
```

#### 0.2 — Install dependencies

The new service needs the same core libraries as `lekha-api`:

```bash
npm install \
  @nestjs/common @nestjs/core @nestjs/platform-express \
  @nestjs/config @nestjs/passport @nestjs/swagger \
  passport passport-jwt \
  @prisma/client prisma \
  class-validator class-transformer \
  reflect-metadata rxjs

npm install --save-dev \
  @types/passport-jwt @types/express \
  typescript ts-node
```

#### 0.3 — Reference the shared Prisma schema

The database already exists and is shared with `lekha-api`. The new service is a
**read/write consumer** of that database — it never runs `prisma migrate`.

Copy only the schema file (not the migrations folder):

```bash
cp lekha-api/prisma/schema.prisma driver-portal-api/prisma/schema.prisma
```

Then generate the Prisma client locally (no migrations, no DB changes):

```bash
cd driver-portal-api
npx prisma generate
```

> **Ownership rule:** All schema changes and migrations continue to be managed
> exclusively by `lekha-api`. The `driver-portal-api` keeps its `schema.prisma`
> in sync by pulling from `lekha-api` and re-running `prisma generate` whenever
> the schema is updated upstream.

#### 0.4 — Set up environment variables

Create `.env` (and `.env.example`).  
`DATABASE_URL` must be the **same connection string** already used by `lekha-api` —
no new database, no new schema:

```env
DATABASE_URL=<same value as lekha-api DATABASE_URL>
SUPABASE_JWT_SECRET=<supabase_project_jwt_secret>
PORT=3002
API_PREFIX=api
```

#### 0.5 — Configure `main.ts`

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import Decimal from 'decimal.js';

// Patch BigInt / Decimal serialisation (same as lekha-api)
(BigInt.prototype as any).toJSON = function () { return this.toString(); };
(Decimal.prototype as any).toJSON = function () { return this.toNumber(); };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Driver Portal API')
    .setDescription('Self-service endpoints for drivers')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
```

---

## Phase 1 — Auth Infrastructure

### Goal
Set up the driver JWT auth pipeline (`DriverJwtStrategy`, `DriverJwtAuthGuard`,
`DriverPortalGuard`, and the `GetUserId` decorator). No database setup is needed —
the service connects directly to the existing shared database via `DATABASE_URL`.

### Tasks

#### 1.1 — Create `PrismaService` and `DatabaseModule`

The `PrismaService` connects to the **existing shared database** using `DATABASE_URL`.
It never runs migrations — it is a pure consumer.

```typescript
// src/common/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  // Delegate table accessors so callers can write `this.prisma.drivers.findFirst()`
  get drivers()    { return this.client.drivers; }
  get contracts()  { return this.client.contracts; }
  get invoice()    { return this.client.invoice; }
  get invoice_payments() { return this.client.invoice_payments; }
  get driver_requests()  { return this.client.driver_requests; }
  get driver_request_categories() { return this.client.driver_request_categories; }
  get driver_request_comments()   { return this.client.driver_request_comments; }
  get driver_request_status_history() { return this.client.driver_request_status_history; }

  async $transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.client.$transaction(fn);
  }

  async onModuleInit() { await this.client.$connect(); }
  async onModuleDestroy() { await this.client.$disconnect(); }
}
```

```typescript
// src/common/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

#### 1.2 — Create `DriverAuthModule`

Copy the two files from `lekha-api`:
- `src/modules/auth/strategies/driver-jwt.strategy.ts` → `src/auth/driver-jwt.strategy.ts`
- `src/modules/auth/guards/driver-jwt-auth.guard.ts` → `src/auth/driver-jwt-auth.guard.ts`

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { DriverJwtStrategy } from './driver-jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'driver-jwt' }), ConfigModule],
  providers: [DriverJwtStrategy],
  exports: [DriverJwtStrategy, PassportModule],
})
export class AuthModule {}
```

#### 1.3 — Create `GetUserId` decorator

```typescript
// src/auth/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId as string;
  },
);
```

#### 1.4 — Create `DriverPortalGuard`

Copy from `lekha-api`:
`src/modules/driver-portal/guards/driver-portal.guard.ts` → `src/guards/driver-portal.guard.ts`

The guard is identical — it queries `drivers.auth_user_id` and attaches `request.driver`.

---

## Phase 2 — Driver Portal Core Module

### Goal
Migrate `DriverPortalService` and `DriverPortalController` (profile, contracts,
invoices, payments, summary, accept-invite).

### Tasks

#### 2.1 — Copy DTOs

Copy these two files verbatim from `lekha-api`:
- `src/modules/driver-portal/dto/driver-portal-response.dto.ts`
- `src/modules/driver-portal/dto/accept-invite.dto.ts`

#### 2.2 — Copy `DriverPortalService`

Copy `src/modules/driver-portal/driver-portal.service.ts` verbatim.
The only import that changes is the path to `PrismaService`:

```typescript
// Change:
import { PrismaService } from '../../common/database/prisma.service';
// To:
import { PrismaService } from '../common/database/prisma.service';
```

#### 2.3 — Copy `DriverPortalController`

Copy `src/modules/driver-portal/driver-portal.controller.ts` verbatim, updating import paths.

Key characteristics to preserve exactly:
- `@Controller('driver-portal')` — URL prefix must match
- `@UseGuards(DriverJwtAuthGuard)` at class level
- `@UseGuards(DriverPortalGuard)` at method level (all routes except `accept-invite`)
- `accept-invite` only has `DriverJwtAuthGuard` (from class) — no `DriverPortalGuard`
- All Swagger decorators (`@ApiTags`, `@ApiBearerAuth`, `@ApiOkResponse`, etc.) must be preserved for OpenAPI parity

#### 2.4 — Create `DriverPortalModule`

```typescript
// src/driver-portal/driver-portal.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { DriverPortalController } from './driver-portal.controller';
import { DriverPortalService } from './driver-portal.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [DriverPortalController],
  providers: [DriverPortalService, DriverPortalGuard],
})
export class DriverPortalModule {}
```

#### 2.5 — Verify endpoints manually

After starting the service, verify each endpoint works against the database:

```bash
# 1. Accept invite
curl -X POST http://localhost:3002/api/driver-portal/accept-invite \
  -H "Authorization: Bearer <driver_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"token":"<invite_token>"}'

# 2. Get profile
curl http://localhost:3002/api/driver-portal/me \
  -H "Authorization: Bearer <driver_jwt>"

# 3. Get contracts
curl http://localhost:3002/api/driver-portal/contracts \
  -H "Authorization: Bearer <driver_jwt>"

# 4. Get invoices
curl http://localhost:3002/api/driver-portal/invoices \
  -H "Authorization: Bearer <driver_jwt>"

# 5. Get payments
curl http://localhost:3002/api/driver-portal/payments \
  -H "Authorization: Bearer <driver_jwt>"

# 6. Get summary
curl http://localhost:3002/api/driver-portal/summary \
  -H "Authorization: Bearer <driver_jwt>"
```

---

## Phase 3 — Driver Requests Module

### Goal
Migrate the **driver-facing** request routes from `driver-portal-requests.controller.ts`
and the relevant parts of `DriverRequestsService` / `DriverRequestsRepository`.

### Tasks

#### 3.1 — Copy DTOs

Copy these files from `lekha-api/src/modules/driver-requests/dto/`:
- `create-driver-request.dto.ts`
- `add-comment.dto.ts`
- `driver-request-response.dto.ts`
- `driver-request-category.dto.ts` (only `DriverRequestCategoryResponseDto` is needed driver-side; the write DTOs can be omitted)

#### 3.2 — Create a driver-scoped repository

The new service only needs the **read/write paths that drivers can trigger**.
Create `src/driver-requests/driver-requests.repository.ts` with a subset of the
monolith's repository:

```typescript
@Injectable()
export class DriverRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Categories — read only
  async listCategories(companyId: string): Promise<DriverRequestCategoryResponseDto[]> { ... }
  async findCategoryById(companyId: string, categoryId: string): Promise<...> { ... }

  // Requests — driver-scoped create, list, and read
  async createRequest(companyId, driverId, categoryId, title, description, severity): Promise<DriverRequestSummaryDto> { ... }
  async listRequests(companyId: string, filters: { driverId?: string }): Promise<DriverRequestSummaryDto[]> { ... }
  async findRequestById(companyId, requestId, driverIdFilter?: string): Promise<DriverRequestDetailDto | null> { ... }
  async findRequestStatus(companyId, requestId, driverIdFilter?: string): Promise<...> { ... }

  // Comments — driver-authored only
  async addComment(requestId, comment, isStaff: false, authorDriverId: string): Promise<DriverRequestCommentDto> { ... }
}
```

Copy the relevant method bodies verbatim from the monolith's repository — they are
pure Prisma queries with no external dependencies.

#### 3.3 — Create a driver-scoped service

```typescript
// src/driver-requests/driver-requests.service.ts
@Injectable()
export class DriverRequestsService {
  constructor(private readonly repo: DriverRequestsRepository) {}

  async createRequest(companyId: string, driverId: string, dto: CreateDriverRequestDto): Promise<DriverRequestSummaryDto> {
    const category = await this.repo.findCategoryById(companyId, dto.category_id);
    if (!category) throw new NotFoundException(`Category ${dto.category_id} not found`);
    if (!category.is_active) throw new BadRequestException('This request category is no longer active');
    return this.repo.createRequest(companyId, driverId, dto.category_id, dto.title, dto.description, category.default_severity);
  }

  async listRequestsForDriver(driverId: string, companyId: string): Promise<DriverRequestSummaryDto[]> {
    return this.repo.listRequests(companyId, { driverId });
  }

  async listCategories(companyId: string): Promise<DriverRequestCategoryResponseDto[]> {
    return this.repo.listCategories(companyId);
  }

  async getRequestDetail(companyId: string, requestId: string, driverId: string): Promise<DriverRequestDetailDto> {
    const request = await this.repo.findRequestById(companyId, requestId, driverId);
    if (!request) throw new NotFoundException('Driver request not found');
    return request;
  }

  async addDriverComment(companyId: string, requestId: string, driverId: string, comment: string): Promise<DriverRequestCommentDto> {
    const request = await this.repo.findRequestStatus(companyId, requestId, driverId);
    if (!request) throw new NotFoundException('Driver request not found');
    return this.repo.addComment(requestId, comment, false, driverId, undefined);
  }
}
```

#### 3.4 — Copy `DriverPortalRequestsController`

Copy `driver-portal-requests.controller.ts` verbatim, updating import paths.

Key characteristics to preserve exactly:
- `@Controller('driver-portal/requests')` — URL prefix must match
- `@UseGuards(DriverJwtAuthGuard, DriverPortalGuard)` at class level
- All Swagger decorators preserved for OpenAPI parity
- `getDriverFromReq` helper (returns `{ id, owner_company_id }`) must work the same way

#### 3.5 — Create `DriverRequestsModule`

```typescript
// src/driver-requests/driver-requests.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { DriverPortalRequestsController } from './driver-portal-requests.controller';
import { DriverRequestsService } from './driver-requests.service';
import { DriverRequestsRepository } from './driver-requests.repository';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [DriverPortalRequestsController],
  providers: [DriverRequestsService, DriverRequestsRepository, DriverPortalGuard],
})
export class DriverRequestsModule {}
```

#### 3.6 — Verify endpoints manually

```bash
# List categories
curl http://localhost:3002/api/driver-portal/requests/categories \
  -H "Authorization: Bearer <driver_jwt>"

# Create request
curl -X POST http://localhost:3002/api/driver-portal/requests \
  -H "Authorization: Bearer <driver_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"category_id":"<uuid>","title":"Need new tyres"}'

# List my requests
curl http://localhost:3002/api/driver-portal/requests \
  -H "Authorization: Bearer <driver_jwt>"

# Get request detail
curl http://localhost:3002/api/driver-portal/requests/<id> \
  -H "Authorization: Bearer <driver_jwt>"

# Add comment
curl -X POST http://localhost:3002/api/driver-portal/requests/<id>/comments \
  -H "Authorization: Bearer <driver_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Please prioritise"}'
```

---

## Phase 4 — Wire App Module & Smoke Test

### Tasks

#### 4.1 — Assemble `AppModule`

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { DriverPortalModule } from './driver-portal/driver-portal.module';
import { DriverRequestsModule } from './driver-requests/driver-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    DriverPortalModule,
    DriverRequestsModule,
  ],
})
export class AppModule {}
```

#### 4.2 — Run Swagger parity check

Open `http://localhost:3002/api/docs` and confirm all endpoints match the contracts
in `api-contracts.md`. Cross-reference against the monolith's Swagger at
`http://localhost:3001/api/docs`.

#### 4.3 — Write E2E smoke tests

Create `test/driver-portal.e2e-spec.ts` covering:
- `POST /driver-portal/accept-invite` — happy path, expired token, already linked
- `GET /driver-portal/me` — authenticated, unauthenticated (401)
- `GET /driver-portal/contracts`
- `GET /driver-portal/invoices`
- `GET /driver-portal/summary`
- `POST /driver-portal/requests`
- `GET /driver-portal/requests`
- `GET /driver-portal/requests/categories`
- `POST /driver-portal/requests/:id/comments`

---

## Phase 5 — Remove from Monolith (Cleanup)

> **Only begin this phase once the new service is deployed and confirmed working in production.**

### Tasks

#### 5.1 — Remove `DriverPortalRequestsController` from `DriverRequestsModule`

In `lekha-api`:

```typescript
// src/modules/driver-requests/driver-requests.module.ts
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [DriverRequestsController],   // Remove DriverPortalRequestsController
  providers: [DriverRequestsService, DriverRequestsRepository],  // Remove DriverPortalGuard if unused elsewhere
  exports: [DriverRequestsService],
})
export class DriverRequestsModule {}
```

Delete `src/modules/driver-requests/driver-portal-requests.controller.ts`.

#### 5.2 — Remove `DriverPortalModule` from `AppModule`

```typescript
// src/app.module.ts  — remove these two lines:
import { DriverPortalModule } from './modules/driver-portal/driver-portal.module';
// ...
DriverPortalModule,
```

Delete the `src/modules/driver-portal/` directory.

#### 5.3 — Audit remaining usages

```bash
# Verify no remaining imports of removed files
grep -r "driver-portal" src/ --include="*.ts"
grep -r "DriverPortalGuard" src/ --include="*.ts"
grep -r "DriverJwtAuthGuard" src/ --include="*.ts"
```

Remove any remaining dead imports.

#### 5.4 — Run monolith tests

```bash
npm test
npm run build
```

Confirm all tests pass and the build is clean.

---

## Phase 6 — Infrastructure & Deployment

### Tasks

#### 6.1 — Provision environment variables

The new service needs only two env vars — no new database or Supabase project:

| Variable | Source |
|---|---|
| `DATABASE_URL` | **Exact same** connection string already used by `lekha-api` — no new DB |
| `SUPABASE_JWT_SECRET` | Supabase project → Settings → API → JWT Secret (same project) |
| `PORT` | Hosting platform (e.g. 3002 or assigned by platform) |
| `API_PREFIX` | `api` (match existing client expectations) |

#### 6.2 — Configure CORS

If the driver mobile app calls this service directly from a web view:

```typescript
app.enableCors({
  origin: ['https://driver.yourdomain.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization', 'Content-Type'],
});
```

#### 6.3 — Set up CI/CD

Mirror the monolith's CI pipeline:
- `prisma generate` before build (generates client from the copied schema — **no migrate**)
- `npm run build` (compile to `dist/`)
- Deploy `dist/` to the hosting platform

---

## Migration Risk Register

| Risk | Mitigation |
|---|---|
| Driver JWT tokens still issued by Supabase (same secret) | No change needed — both services share `SUPABASE_JWT_SECRET` |
| Prisma schema drift when `lekha-api` runs new migrations | After each migration in `lekha-api`, copy `schema.prisma` to `driver-portal-api` and re-run `prisma generate` + rebuild. `driver-portal-api` never runs `prisma migrate`. |
| `DriverPortalGuard` in monolith becomes unused code | Confirmed in Phase 5.3 by grepping for usages |
| `duration_ms` (BigInt) not serialising correctly | Apply the `toJSON` patch in `main.ts` (see data-models.md) |
| `Prisma.Decimal` fields (amounts) serialising as objects | Apply the `Decimal.prototype.toJSON` patch in `main.ts` |
| Double-writing risk during cutover | Run both services in parallel; route driver traffic to new service via API gateway or DNS change; remove monolith routes in Phase 5 only after confirming new service is stable |
