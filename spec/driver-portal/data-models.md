# Driver Portal API — Data Models

## Prisma Schema (relevant tables)

All tables live in the `public` schema of the **existing shared PostgreSQL database**.
The `driver-portal-api` connects to that same database using the identical `DATABASE_URL`
already used by `lekha-api`. No new database, no new schema, and no migrations are
run from the new service — schema ownership stays exclusively with `lekha-api`.

The `schema.prisma` file is copied from `lekha-api` into `driver-portal-api` purely
so `prisma generate` can produce a local TypeScript client. The tables used by the
driver portal are documented below for reference.

### `drivers`

```prisma
model drivers {
  id                      String    @id @default(dbgenerated("extensions.uuid_generate_v4()")) @db.Uuid
  created_at              DateTime  @default(now()) @db.Timestamptz(6)
  owner_user_id           String    @db.Uuid
  owner_company_id        String    @db.Uuid
  first_name              String
  last_name               String
  email                   String?
  mobile                  String?
  dob                     DateTime? @db.Timestamptz(6)
  license_number          String?
  license_expiry          DateTime? @db.Timestamptz(6)
  license_state           String?
  license_country         String?
  address_line_one        String?
  address_line_two        String?
  address_suburb          String?
  address_state           String?
  address_post_code       String?
  address_country         String?
  emergency_name          String?
  emergency_phone         String?
  emergency_relation      String?
  business_name           String?   @db.VarChar(255)
  business_abn            String?   @db.VarChar(11)
  card_last_four          String?   @db.VarChar(4)
  card_expiry_month       Int?      @db.SmallInt
  card_expiry_year        Int?      @db.SmallInt
  card_setup_at           DateTime? @db.Timestamptz(6)
  stripe_customer_id      String?
  stripe_setup_link       String?
  payway_customer_number  String?   @unique @db.VarChar(20)
  auth_user_id            String?   @unique @db.Uuid   // ← links to Supabase user
  invite_token            String?   @unique @db.Uuid
  invite_token_expires_at DateTime? @db.Timestamptz(6)

  contracts               contracts[]
  invoice                 invoice[]
  subscription            subscription[]
  driver_requests         driver_requests[]
  driver_request_comments_authored driver_request_comments[] @relation("driver_request_comments_driver")

  @@index([auth_user_id], map: "idx_drivers_auth_user_id")
  @@schema("public")
}
```

### `contracts`

Key fields fetched by the driver portal (full schema omitted for brevity):

```prisma
model contracts {
  id                    String   @id @db.Uuid
  driver_id             String   @db.Uuid
  name                  String
  type                  String
  start_date            DateTime
  end_date              DateTime?
  length_in_weeks       Int
  allowed_kms_per_week  Int?
  preferred_payment_day String?
  is_manual_payment     Boolean
  intended_use          String?
  fuel_level            String?
  deposit_received      Decimal?
  car_id                String?  @db.Uuid
  car_price_id          String?  @db.Uuid

  drivers              drivers               @relation(...)
  cars                 cars?                 @relation(...)
  car_prices           car_prices?           @relation(...)
  contract_return_info contract_return_info?

  @@schema("public")
}
```

### `invoice`

Key fields fetched by the driver portal:

```prisma
model invoice {
  id                     String    @id @db.Uuid
  driver_id              String?   @db.Uuid
  invoice_name           String?
  invoice_status         String
  amount                 Decimal
  balance                Decimal
  period_start           DateTime?
  period_end             DateTime?
  due_date               DateTime?
  expected_payment_date  DateTime?
  created_at             DateTime
  currency               String?

  drivers          drivers?
  subscription     subscription?   @relation(...)
  invoice_item     invoice_item[]
  invoice_payments invoice_payments[]

  @@schema("public")
}
```

### `invoice_payments`

```prisma
model invoice_payments {
  id               String    @id @db.Uuid
  invoice_id       String    @db.Uuid
  amount           Decimal
  payment_date     DateTime
  payment_method   String?
  reference_number String?
  notes            String?
  is_reversed      Boolean   @default(false)

  invoice invoice @relation(...)

  @@schema("public")
}
```

### `driver_request_categories`

```prisma
model driver_request_categories {
  id               String                  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at       DateTime                @default(now()) @db.Timestamptz(6)
  updated_at       DateTime                @default(now()) @db.Timestamptz(6)
  owner_company_id String                  @db.Uuid
  name             String                  @db.VarChar(100)
  description      String?
  default_severity driver_request_severity @default(medium)
  is_active        Boolean                 @default(true)

  companies       companies         @relation(...)
  driver_requests driver_requests[]

  @@index([owner_company_id], map: "idx_driver_req_categories_company")
  @@index([is_active], map: "idx_driver_req_categories_active")
  @@schema("public")
}
```

### `driver_requests`

```prisma
model driver_requests {
  id               String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at       DateTime              @default(now()) @db.Timestamptz(6)
  updated_at       DateTime              @default(now()) @db.Timestamptz(6)
  owner_company_id String                @db.Uuid
  driver_id        String                @db.Uuid
  category_id      String                @db.Uuid
  title            String                @db.VarChar(255)
  description      String?
  severity         driver_request_severity
  status           driver_request_status @default(new)
  assigned_to      String?               @db.Uuid
  resolved_at      DateTime?             @db.Timestamptz(6)
  resolved_by      String?               @db.Uuid
  resolve_comment  String?

  drivers                       drivers                   @relation(...)
  driver_request_categories     driver_request_categories @relation(...)
  assigned_user                 user_profiles?
  resolved_user                 user_profiles?
  driver_request_comments       driver_request_comments[]
  driver_request_status_history driver_request_status_history[]

  @@index([owner_company_id], map: "idx_driver_requests_company")
  @@index([driver_id],        map: "idx_driver_requests_driver")
  @@index([status],           map: "idx_driver_requests_status")
  @@index([category_id],      map: "idx_driver_requests_category")
  @@schema("public")
}
```

### `driver_request_comments`

```prisma
model driver_request_comments {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at       DateTime  @default(now()) @db.Timestamptz(6)
  request_id       String    @db.Uuid
  comment          String
  is_staff_comment Boolean   @default(false)
  author_driver_id String?   @db.Uuid
  author_user_id   String?   @db.Uuid

  driver_requests driver_requests @relation(...)
  author_driver   drivers?        @relation("driver_request_comments_driver", ...)
  author_user     user_profiles?  @relation("driver_request_comments_user", ...)

  @@index([request_id], map: "idx_driver_req_comments_request")
  @@schema("public")
}
```

### `driver_request_status_history`

```prisma
model driver_request_status_history {
  id          String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_at  DateTime               @default(now()) @db.Timestamptz(6)
  request_id  String                 @db.Uuid
  from_status driver_request_status?
  to_status   driver_request_status
  changed_by  String?                @db.Uuid
  note        String?
  duration_ms BigInt?

  driver_requests driver_requests @relation(...)
  changed_by_user user_profiles?  @relation(...)

  @@index([request_id], map: "idx_driver_req_history_request")
  @@schema("public")
}
```

### Enums

```prisma
enum driver_request_status {
  new
  in_progress
  blocked
  resolved
  closed
}

enum driver_request_severity {
  low
  medium
  high
  critical
}
```

---

## TypeScript DTOs

### `AcceptInviteDto` / `AcceptInviteResponseDto`
(`src/modules/driver-portal/dto/accept-invite.dto.ts`)

```typescript
export class AcceptInviteDto {
  @IsString() @IsNotEmpty() @IsUUID('4')
  token: string;
}

export class AcceptInviteResponseDto {
  driver_id: string;
}
```

### `DriverProfileResponse`
(`src/modules/driver-portal/dto/driver-portal-response.dto.ts`)

```typescript
export class DriverProfileResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  dob: Date | null;
  license_number: string | null;
  license_expiry: Date | null;
  license_state: string | null;
  license_country: string | null;
  address_line_one: string | null;
  address_line_two: string | null;
  address_suburb: string | null;
  address_state: string | null;
  address_post_code: string | null;
  address_country: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  business_name: string | null;
  business_abn: string | null;
  card_last_four: string | null;
  card_expiry_month: number | null;
  card_expiry_year: number | null;
  created_at: Date;
}
```

### `DriverContractSummary` (and nested classes)
(`src/modules/driver-portal/dto/driver-portal-response.dto.ts`)

```typescript
export class ContractCarSummary {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  registration: string | null;
  color: string | null;
}

export class ContractPriceSummary {
  id: string;
  name: string | null;
  unit_amount: number;
  interval: string;
  interval_count: number;
}

export class ContractReturnInfoSummary {
  return_date: Date | null;
  notice_date: Date | null;
}

export class DriverContractSummary {
  id: string;
  name: string;
  type: string;
  start_date: Date;
  end_date: Date | null;
  length_in_weeks: number;
  allowed_kms_per_week: number | null;
  preferred_payment_day: string | null;
  is_manual_payment: boolean;
  intended_use: string | null;
  fuel_level: string | null;
  deposit_received: number | null;
  cars: ContractCarSummary | null;
  car_prices: ContractPriceSummary | null;
  contract_return_info: ContractReturnInfoSummary | null;
}
```

### `DriverInvoiceSummary` (and nested classes)

```typescript
export class InvoiceItemSummary {
  id: number;
  description: string | null;
  unit_amount: number;
  quantity: number;
  gst_percentage: number | null;
}

export class InvoicePaymentRecord {
  id: string;
  amount: number;
  payment_date: Date;
  payment_method: string | null;
  reference_number: string | null;
}

export class DriverInvoiceSummary {
  id: string;
  invoice_name: string | null;
  invoice_status: string;
  amount: number;
  balance: number;
  period_start: Date | null;
  period_end: Date | null;
  due_date: Date | null;
  expected_payment_date: Date | null;
  created_at: Date;
  currency: string | null;
  invoice_item: InvoiceItemSummary[];
  invoice_payments: InvoicePaymentRecord[];
}
```

### `DriverPaymentSummary`

```typescript
export class InvoiceRef {
  id: string;
  invoice_name: string | null;
  invoice_status: string;
}

export class DriverPaymentSummary {
  id: string;
  amount: number;
  payment_date: Date;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  invoice: InvoiceRef;
}
```

### `DriverBalanceSummary`

```typescript
export class ActiveContractInfo {
  id: string;
  name: string;
  start_date: Date;
  preferred_payment_day: string | null;
  payment_amount: number | null;
  payment_interval: string | null;
  payment_interval_count: number | null;
}

export class DriverBalanceSummary {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  active_contract: ActiveContractInfo | null;
}
```

### `CreateDriverRequestDto`

```typescript
export class CreateDriverRequestDto {
  @IsUUID()                     category_id: string;
  @IsString() @MaxLength(255)   title: string;
  @IsOptional() @IsString()     description?: string;
}
```

### `AddCommentDto`

```typescript
export class AddCommentDto {
  @IsString() @MinLength(1)  comment: string;
}
```

### `DriverRequestSummaryDto`

```typescript
export class DriverRequestSummaryDto {
  id: string;
  title: string;
  status: driver_request_status;
  severity: driver_request_severity;
  category_id: string;
  category_name: string;
  driver_id: string;
  description: string | null;
  assigned_to: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### `DriverRequestDetailDto`

```typescript
export class DriverRequestDetailDto extends DriverRequestSummaryDto {
  comments: DriverRequestCommentDto[];
  status_history: DriverRequestStatusHistoryDto[];
  resolved_at: Date | null;
  resolved_by: string | null;
  resolve_comment: string | null;
}
```

### `DriverRequestCommentDto`

```typescript
export class DriverRequestCommentDto {
  id: string;
  request_id: string;
  comment: string;
  is_staff_comment: boolean;
  author_driver_id: string | null;
  author_user_id: string | null;
  created_at: Date;
}
```

### `DriverRequestCategoryResponseDto`

```typescript
export class DriverRequestCategoryResponseDto {
  id: string;
  name: string;
  description: string | null;
  default_severity: driver_request_severity;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

---

## Serialisation Notes

`BigInt` fields (e.g. `duration_ms` in `driver_request_status_history`) must be
serialised as strings in JSON responses. In `main.ts` of the new service add:

```typescript
// Patch BigInt serialisation
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Patch Prisma.Decimal serialisation
import Decimal from 'decimal.js';
(Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};
```
