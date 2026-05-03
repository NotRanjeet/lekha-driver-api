# Driver Portal API — Authentication Model

## Overview

The driver portal uses a **two-layer auth chain** that is distinct from the main
fleet-manager JWT flow:

```
Request
  └── DriverJwtAuthGuard         (verifies Supabase JWT signature, no DB call)
        └── DriverPortalGuard    (resolves driver record from auth_user_id, attaches to request)
```

`DriverJwtAuthGuard` is applied at **controller level** (all routes in a controller).  
`DriverPortalGuard` is applied at **route level** for most routes, except
`POST /driver-portal/accept-invite` which only needs the JWT guard.

---

## Layer 1 — `DriverJwtStrategy` / `DriverJwtAuthGuard`

### Strategy (`driver-jwt.strategy.ts`)

```typescript
@Injectable()
export class DriverJwtStrategy extends PassportStrategy(Strategy, 'driver-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: { sub: string; email?: string }): { userId: string; email: string } {
    if (!payload?.sub) throw new UnauthorizedException('Invalid token payload');
    return { userId: payload.sub, email: payload.email ?? '' };
  }
}
```

**What it does:**
- Extracts the JWT from `Authorization: Bearer <token>`
- Verifies the signature using `SUPABASE_JWT_SECRET` (HS256)
- Returns `{ userId, email }` which Passport stores in `request.user`
- Makes **no database calls**

**Environment variable required:**

| Variable | Description |
|---|---|
| `SUPABASE_JWT_SECRET` | Supabase project JWT secret (from Supabase dashboard → Settings → API) |

### Guard (`driver-jwt-auth.guard.ts`)

```typescript
@Injectable()
export class DriverJwtAuthGuard extends AuthGuard('driver-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

Standard Passport guard wrapper. Returns `401` if the token is missing, expired, or
signature verification fails.

---

## Layer 2 — `DriverPortalGuard`

### Source (`guards/driver-portal.guard.ts`)

```typescript
@Injectable()
export class DriverPortalGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.userId;

    if (!userId) throw new UnauthorizedException('Not authenticated');

    const driver = await this.prisma.drivers.findFirst({
      where: { auth_user_id: userId },
      select: { id: true, owner_company_id: true },
    });

    if (!driver) {
      throw new UnauthorizedException(
        'No driver account is linked to this user. Please contact your fleet manager.',
      );
    }

    request.driver = driver;   // ← attaches { id, owner_company_id }
    return true;
  }
}
```

**What it does:**
1. Reads `request.user.userId` set by `DriverJwtAuthGuard`
2. Queries `drivers` table: `WHERE auth_user_id = userId`
3. On success, attaches `request.driver = { id: string, owner_company_id: string }` to the request
4. All downstream handlers use `request.driver.id` (driver's UUID) and
   `request.driver.owner_company_id` (company scope) for data isolation

**One database call per request** (uses the indexed `idx_drivers_auth_user_id` index).

---

## `request.driver` Interface

```typescript
interface DriverPayload {
  id: string;               // drivers.id  (UUID)
  owner_company_id: string; // drivers.owner_company_id (UUID)
}
```

Controllers access it with a helper:

```typescript
function getDriverFromReq(req: Request): DriverPayload {
  return (req as Request & { driver: DriverPayload }).driver;
}
```

---

## Invite Flow (accept-invite endpoint)

The only bootstrap endpoint — links a new Supabase user to their driver record.

```
Fleet Manager                      Driver App                     lekha-api / driver-portal-api
      │                                │                                    │
      │  POST /drivers/:id/generate-invite                                  │
      │──────────────────────────────────────────────────────────────────►  │
      │  ◄── { invite_token }                                               │
      │                                │                                    │
      │  Send token to driver ────────►│                                    │
      │                                │                                    │
      │                                │  POST /driver-portal/accept-invite │
      │                                │  { token, Authorization: Bearer }  │
      │                                │──────────────────────────────────► │
      │                                │                         DB: set auth_user_id
      │                                │                         DB: clear invite_token
      │                                │  ◄── 200 { driver_id }             │
      │                                │                                    │
      │                                │  (all /driver-portal/* now work)   │
```

**Validation steps in `DriverPortalService.acceptInvite`:**

1. Find driver by `invite_token` — `404` if not found or already cleared
2. Check `auth_user_id IS NULL` — `409` if already linked
3. Check `invite_token_expires_at > NOW()` — `400` if expired
4. Check caller's `userId` is not already linked to another driver — `409` if so
5. `UPDATE drivers SET auth_user_id=userId, invite_token=NULL, invite_token_expires_at=NULL`
6. Return `{ driver_id }`

---

## Module Registration

In the new `driver-portal-api` the `AuthModule` must provide both strategies:

```typescript
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'driver-jwt' }), ConfigModule],
  providers: [DriverJwtStrategy],
  exports: [DriverJwtStrategy, PassportModule],
})
export class DriverAuthModule {}
```

And the app module must import `DriverAuthModule` and `DatabaseModule` so that
`DriverPortalGuard` and `DriverPortalService` have `PrismaService` available.

---

## Security Considerations

- The `DriverJwtStrategy` uses the same Supabase `SUPABASE_JWT_SECRET` as the monolith
  — no separate secret is needed, but the env var must be provisioned in the new service.
- `DriverPortalGuard` automatically enforces **multi-tenant isolation** via
  `owner_company_id` — every service method that creates or reads data should be scoped
  by `request.driver.owner_company_id`.
- The `accept-invite` endpoint must only be reachable over HTTPS in production; tokens
  are single-use UUIDs and expire.
