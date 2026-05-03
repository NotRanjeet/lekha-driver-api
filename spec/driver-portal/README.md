# Driver Portal — Standalone API Migration Spec

## Overview

The driver-facing functionality is currently spread across two NestJS modules within the
main `lekha-api` monolith:

| Module | Files | Purpose |
|---|---|---|
| `src/modules/driver-portal` | controller, service, guard, DTOs | Profile, contracts, invoices, payments, balance summary, invite acceptance |
| `src/modules/driver-requests` | controller × 2, service, repository, DTOs | Request categories and tickets submitted by drivers; staff management of those tickets |

The goal of this migration is to lift all **driver-facing** endpoints out of the monolith
and into their own deployable service (`driver-portal-api`), while leaving the
**staff-facing** endpoints (`driver-requests.controller.ts` — routes under
`/driver-requests`) unchanged in the monolith.

---

## Scope

### Included in the new `driver-portal-api`

| Current file | Target |
|---|---|
| `driver-portal.controller.ts` | `driver-portal-api` |
| `driver-portal.service.ts` | `driver-portal-api` |
| `driver-portal.module.ts` | replaced by app module in new service |
| `guards/driver-portal.guard.ts` | `driver-portal-api` |
| `dto/driver-portal-response.dto.ts` | `driver-portal-api` |
| `dto/accept-invite.dto.ts` | `driver-portal-api` |
| `driver-portal-requests.controller.ts` | `driver-portal-api` |
| `driver-requests.service.ts` (driver-side methods only) | shared or duplicated in `driver-portal-api` |
| `repositories/driver-requests.repository.ts` (driver-side queries) | `driver-portal-api` |
| `dto/create-driver-request.dto.ts` | `driver-portal-api` |
| `dto/add-comment.dto.ts` | `driver-portal-api` |
| `dto/driver-request-response.dto.ts` | `driver-portal-api` (read-only DTOs) |
| `dto/driver-request-category.dto.ts` → `DriverRequestCategoryResponseDto` | `driver-portal-api` |
| `auth/strategies/driver-jwt.strategy.ts` | `driver-portal-api` |
| `auth/guards/driver-jwt-auth.guard.ts` | `driver-portal-api` |

### Stays in `lekha-api` (monolith)

| Current file | Status |
|---|---|
| `driver-requests.controller.ts` (staff routes under `/driver-requests`) | unchanged |
| `driver-requests.service.ts` (staff-side methods: startProgress, resolve, block, addStaffComment, createCategory, listRequestsForCompany) | unchanged |
| `repositories/driver-requests.repository.ts` | unchanged (full repository stays; new service may call it via shared lib or duplicate read-only queries) |
| `prisma/schema.prisma` + `prisma/migrations/` | **Schema and migration ownership stays here.** `driver-portal-api` copies `schema.prisma` for client generation only, never runs `prisma migrate`. |

---

## Goals

1. **Zero API drift** — all existing driver-facing endpoints keep the same HTTP methods, paths, request bodies, and response shapes.
2. **No schema changes** — the new service connects to the same PostgreSQL database, using the same Prisma schema.
3. **No breaking change to monolith** — the staff `/driver-requests` controller is untouched.
4. **Standalone auth** — the `DriverJwtStrategy` (Supabase JWT, no DB lookup) and `DriverPortalGuard` (resolves driver from `auth_user_id`) ship with the new service.
5. **Swagger parity** — the new service exposes identical OpenAPI docs for all migrated endpoints.

---

## Spec Documents

| File | Contents |
|---|---|
| [api-contracts.md](./api-contracts.md) | Full HTTP contract for every driver-facing endpoint |
| [data-models.md](./data-models.md) | Prisma schema, DTO classes, and response shapes |
| [auth-model.md](./auth-model.md) | JWT strategy, guard chain, and request augmentation |
| [migration-plan.md](./migration-plan.md) | Phased implementation tasks with code examples |
