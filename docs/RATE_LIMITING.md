# Rate Limiting Overview

Notly implements **token bucket rate limiting** using [Bucket4j](https://github.com/bucket4j/bucket4j) to protect the API from abuse, brute-force attacks, and accidental client loops.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────┐
│  HTTP Request   │────▶│ RateLimitingFilter  │────▶│ JWT Filter  │
└─────────────────┘     └─────────────────────┘     └─────────────┘
         │                         │
         ▼                         ▼
   Rate Limit Headers      Token Bucket (per client)
   X-RateLimit-*            Bucket4j in-memory cache
```

**Filter order**: `RateLimitingFilter` runs **before** `JwtAuthenticationFilter` so that unauthenticated abuse (e.g., login brute force) is blocked early without wasting JWT validation resources.

---

## Tiers

Requests are classified into four tiers based on path matching:

| Tier | Capacity / min | Burst | Paths | Use Case |
|------|---------------|-------|-------|----------|
| **Public** | 20 | 30 | `/api/v1/auth/**`, `/oauth2/**`, public shares | Login, register, OAuth callbacks |
| **API** | 100 | 150 | Everything else (authenticated) | CRUD on notes, groups, workspaces |
| **Heavy** | 10 | 15 | `/search`, `/export` | Expensive queries, bulk operations |
| **Sensitive** | 5 | 8 | `/change-password`, `/delete-account` | Account security operations |

> **Priority order**: sensitive → heavy → public → api. A path is matched against tiers in this order.

---

## Client Identification

The rate limiter uses the **most specific identifier available**:

1. **Authenticated user**: `user:<email_or_username>`
2. **Anonymous**: `ip:<X-Forwarded-For || X-Real-IP || RemoteAddr>`

This means:
- A logged-in user has their own bucket, unaffected by other users on the same IP.
- Anonymous requests share a bucket per IP.

---

## Response Headers

Every response includes rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Requests allowed per window (e.g., `100`) |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Retry-After` | Seconds until next token (only on `429` responses) |

---

## 429 Response

When the limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Retry-After: 12
Content-Type: application/json

{
  "success": false,
  "code": "RAT_001",
  "status": 429,
  "message": "Rate limit exceeded. Please try again in 12 seconds.",
  "retryAfter": 12,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Skipped Paths

Rate limiting is **disabled** for:

- `/swagger-ui/**` and `/v3/api-docs/**` — Swagger/OpenAPI docs
- `/actuator/health` — Health checks
- `/` and `/test` — Root and test endpoints

---

## Configuration

All limits are externalized in `application.yml`:

```yaml
rate-limit:
  enabled: true
  refill-period: PT1M        # ISO-8601 duration: 1 minute
  public-tier:
    capacity: 20
    burst: 30
  api-tier:
    capacity: 100
    burst: 150
  heavy-tier:
    capacity: 10
    burst: 15
  sensitive-tier:
    capacity: 5
    burst: 8
```

Toggle `enabled: false` to disable rate limiting entirely (useful for local dev or load testing).

---

## CORS

Rate limit headers are exposed to the browser via CORS:

```java
config.setExposedHeaders(List.of(
    "Authorization", "Content-Type",
    "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Retry-After"
));
```

The frontend can read these headers to show a countdown or disable buttons when the limit is near.

---

## Monitoring

Blocked requests are logged at `WARN` level:

```
[RATE_LIMIT] Blocked ip:192.168.1.10 on /api/v1/auth/login (tier=public) — retry after 45s
```

Search logs for `[RATE_LIMIT]` to identify abuse patterns or misconfigured clients.

---

## Files

| File | Purpose |
|------|---------|
| `config/RateLimitProperties.java` | `@ConfigurationProperties` for tier settings |
| `service/RateLimitService.java` | Bucket creation, caching, and tier resolution |
| `security/RateLimitingFilter.java` | Servlet filter that enforces limits per request |
| `config/security/SecurityConfig.java` | Filter chain registration and CORS headers |
| `exception/ErrorCode.java` | `RATE_LIMIT_EXCEEDED` error code |
| `application.yml` | Externalized rate limit values |
| `docs/RATE_LIMITING.md` | This document |

---

## Future Enhancements

1. **Redis-backed buckets** — Share rate limit state across multiple server instances.
2. **Per-user overrides** — Allow premium users higher limits via database config.
3. **WebSocket rate limits** — Apply token buckets to WebSocket message rates.
4. **GraphQL complexity limits** — Rate limit based on query cost rather than request count.
