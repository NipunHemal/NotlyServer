# Exception Handling — Improvement Guide (Expert Level)

**Project:** Notly Server (Spring Boot 3.x, Java 17+)
**Scope:** `src/main/java/lk/hemal/notly/exception/` and `GlobalExceptionHandler`
**Date:** 2026-05-11
**Goal:** Move the current exception layer to an industry-grade, RFC 7807-compliant, observable, secure, and performant design.

> **Documentation only — no code changes.** Use this as a roadmap for a future refactor.

---

## 1. Current State Snapshot

```
exception/
├── NotlyException.java                  (base, extends RuntimeException, holds HttpStatus)
├── BadRequestException.java             (400)
├── ConflictException.java               (409)
├── DuplicateResourceException.java      (extends ConflictException)
├── ForbiddenException.java              (403)
├── InvalidCredentialsException.java     (extends UnauthorizedException)
├── ResourceAlreadyExistException.java   (extends ConflictException — duplicate of DuplicateResourceException)
├── ResourceNotFoundException.java       (404)
├── UnauthorizedException.java           (401)
├── ValidationException.java             (400)
├── AuthException.java                   (parallel inner-class hierarchy; not part of the main tree)
└── GlobalExceptionHandler.java          (3 handlers: NotlyException, MethodArgumentNotValid, Exception)
```

The base envelope returned to clients is `dto/ApiResponse<T>` with fields: `success`, `message`, `data`, `timestamp`.

---

## 2. Problems With the Current Design

| # | Issue | Severity | Why it matters |
|---|-------|----------|----------------|
| 1 | `HttpStatus` is encoded into the exception itself | HIGH | Couples a domain error to a transport (HTTP). The same domain error in a CLI / job / message-queue context cannot be reused. |
| 2 | No error **code** (only a free-text `message`) | HIGH | Clients must parse strings or hard-code statuses to branch. i18n is impossible. |
| 3 | `DuplicateResourceException` **and** `ResourceAlreadyExistException` both exist | MEDIUM | Two near-identical exception classes (one has a typo in the name + message). Confusion + dead code risk. |
| 4 | `AuthException` uses a **separate, inner-static hierarchy** | MEDIUM | Inconsistent with the rest of the tree. Adding a new auth error requires touching one big class instead of a new file. |
| 5 | `GlobalExceptionHandler` catches only 3 things | HIGH | Many Spring/JPA/Security exceptions fall through to the generic `Exception` handler and become 500s (e.g. `AccessDeniedException`, `HttpMessageNotReadableException`, `DataIntegrityViolationException`, `MaxUploadSizeExceededException`, `NoHandlerFoundException`, `ConstraintViolationException` for `@RequestParam`/`@PathVariable`). |
| 6 | Error response shape differs from success shape | MEDIUM | Success uses `ApiResponse<T>`; errors reuse it but pack the field-error map into `data`. Doesn't match RFC 7807 and is awkward for typed clients. |
| 7 | Generic `Exception` handler returns the message `"An unexpected error occurred"` with status 500 — but **does not return a correlation ID** | HIGH | Impossible to correlate a user-visible 500 with a server-side log line. Support tickets become a guessing game. |
| 8 | `handleNotlyException` returns the exception's `getMessage()` verbatim | HIGH | Internal details (e.g. SQL fragments, stack hints) could leak. Messages are usually written for developers, not end users. |
| 9 | `LocalDateTime.now()` used without zone | LOW | Implementation-default zone; ambiguous for clients across time zones. Should be `Instant` (UTC). |
| 10 | No structured logging context (MDC) | HIGH | Cannot filter logs by request ID, user ID, tenant, route, etc. — slows incident triage. |
| 11 | `log.error` is used for client-caused 4xx errors | MEDIUM | Pollutes error dashboards and pages on-call for normal user input mistakes. |
| 12 | Stack trace lost on generic `Exception` (`log.error(..., ex)` exists, but the inner cause chain often isn't dumped fully) | MEDIUM | Especially painful for wrapped Spring/JPA exceptions. |
| 13 | No handling for **async** (`@Async`) exceptions or **scheduled** task exceptions | MEDIUM | These never hit `@RestControllerAdvice`. |
| 14 | No specific handler for Spring Security exceptions (`AuthenticationException`, `AccessDeniedException`) | HIGH | They never reach `GlobalExceptionHandler` because they fire inside the security filter chain — must be handled by `AuthenticationEntryPoint` / `AccessDeniedHandler`. Currently those write a hand-rolled JSON that doesn't match the rest of the API. |
| 15 | `NotlyException` is `RuntimeException` and stack-traces are filled on construction | LOW | High-throughput hot paths (validation rejections, 401s) pay a measurable cost. Optionally override `fillInStackTrace()` for performance-critical, expected exceptions. |
| 16 | Sinhala comments mixed with English | NIT | Hurts collaborator readability and code review. |

---

## 3. Industry Best Practices (What Expert Teams Do)

1. **Decouple domain errors from HTTP.**
   The exception describes *what is wrong* (`USER_NOT_FOUND`), not *what status to return* (`404`). A central layer maps codes → HTTP status. The same exception can be reused by gRPC, Kafka consumers, batch jobs.

2. **Adopt RFC 7807 — `application/problem+json`.**
   Industry-standard error envelope: `{ type, title, status, detail, instance, code, errors[], traceId, timestamp }`. Spring Framework 6 / Boot 3 ship `ProblemDetail` and `ErrorResponse` for exactly this. Use them.

3. **Stable, machine-readable error codes.**
   `NOTLY-AUTH-001`, `NOTLY-NOTE-404`, etc. Codes are forever; messages can be localized and improved.

4. **Two messages per exception.**
   - `developerMessage` — verbose, internal, in logs.
   - `userMessage` — safe, short, localizable, sent to client.
   Never let internals leak by default.

5. **Sealed / final exception hierarchy.**
   Java 17 `sealed` classes guarantee the handler's switch is exhaustive. Prevents "mystery" subclass that no one knows how to respond to.

6. **Map every framework exception explicitly.**
   Every Spring/JPA/Security exception you care about gets its own handler method, in order from most specific to least specific. The generic `Exception` handler is a last-resort safety net that always returns a 500 with a `traceId`.

7. **Correlation / trace ID on every response.**
   Generated at the filter level (`X-Request-Id` header or via Micrometer Tracing), propagated through MDC, returned in the error body and response header. Required for production support.

8. **Use the right log level.**
   - `4xx` (client error) → `WARN` or `INFO`. No stack trace.
   - `5xx` (server error) → `ERROR` with full stack trace.
   - Auth failures → `WARN` (security-relevant, but not an outage).

9. **Validation: aggregate, don't bail on first error.**
   Return *all* field errors at once. Currently only `MethodArgumentNotValidException` is handled — `ConstraintViolationException` (for `@RequestParam` / `@PathVariable` / `@Validated` on service methods) is not.

10. **Idempotent, type-safe error shape.**
    Clients should be able to write `if (response.code === 'NOTLY-AUTH-001')` instead of regex-matching `"Invalid email"`.

11. **Don't let exceptions cross transactional boundaries unexpectedly.**
    Distinguish *checked* from *runtime* exceptions in service contracts so `@Transactional` rollback rules behave the way you expect (default only rolls back on `RuntimeException`/`Error`).

12. **Performance:** for high-volume expected exceptions (validation, 401), avoid full stack capture (`fillInStackTrace()` override). Pre-create singleton exception instances where messages don't vary.

13. **Observability:** counter per error code (`micrometer` → Prometheus). Alert when a code's rate spikes.

---

## 4. Recommended Architecture

### 4.1 New file layout

```
exception/
├── core/
│   ├── ErrorCode.java                 ← enum (CODE, HttpStatus, defaultMessageKey)
│   ├── ErrorCategory.java             ← enum (AUTH, NOTE, USER, SYSTEM, VALIDATION, ...)
│   └── BaseException.java             ← sealed; permits Notly*Exception subclasses
│
├── domain/
│   ├── auth/
│   │   ├── InvalidCredentialsException.java
│   │   ├── AccountLockedException.java
│   │   ├── TokenExpiredException.java
│   │   └── TokenReuseException.java
│   ├── note/
│   │   ├── NoteNotFoundException.java
│   │   ├── NotePermissionDeniedException.java
│   │   └── NoteAlreadySharedException.java
│   ├── user/
│   │   ├── UserNotFoundException.java
│   │   └── DuplicateUserException.java   ← (rename DuplicateResourceException → split per resource)
│   └── ...
│
├── handler/
│   ├── GlobalExceptionHandler.java       ← @RestControllerAdvice (orchestrator)
│   ├── ValidationExceptionHandler.java   ← isolated for clarity (optional, can stay in one file)
│   ├── SecurityExceptionHandler.java     ← Spring Security exceptions
│   └── DataAccessExceptionHandler.java   ← JPA / DB exceptions
│
├── model/
│   ├── ProblemResponse.java              ← RFC 7807 envelope (or use Spring's ProblemDetail directly)
│   └── FieldViolation.java               ← { field, rejectedValue, code, message }
│
└── support/
    ├── ErrorMessageResolver.java         ← i18n via MessageSource
    └── CorrelationIdProvider.java        ← reads from MDC or generates
```

### 4.2 Sealed base exception

```java
public sealed abstract class BaseException extends RuntimeException
        permits AuthDomainException, NoteDomainException,
                UserDomainException, ValidationDomainException,
                SystemException {

    private final ErrorCode code;
    private final Map<String, Object> context; // optional, for log enrichment

    protected BaseException(ErrorCode code, String developerMessage,
                            Throwable cause, Map<String, Object> context) {
        super(developerMessage, cause);
        this.code = code;
        this.context = context == null ? Map.of() : Map.copyOf(context);
    }

    public ErrorCode getCode() { return code; }
    public Map<String, Object> getContext() { return context; }

    /** Override on hot-path expected exceptions to skip stack capture. */
    protected BaseException disableStack() { return this; }
}
```

### 4.3 `ErrorCode` enum (single source of truth)

```java
public enum ErrorCode {
    // Auth
    AUTH_INVALID_CREDENTIALS ("NOTLY-AUTH-001", HttpStatus.UNAUTHORIZED, "error.auth.invalid_credentials"),
    AUTH_ACCOUNT_DISABLED    ("NOTLY-AUTH-002", HttpStatus.FORBIDDEN,    "error.auth.account_disabled"),
    AUTH_TOKEN_EXPIRED       ("NOTLY-AUTH-003", HttpStatus.UNAUTHORIZED, "error.auth.token_expired"),
    AUTH_TOKEN_INVALID       ("NOTLY-AUTH-004", HttpStatus.UNAUTHORIZED, "error.auth.token_invalid"),

    // Note
    NOTE_NOT_FOUND           ("NOTLY-NOTE-001", HttpStatus.NOT_FOUND,    "error.note.not_found"),
    NOTE_PERMISSION_DENIED   ("NOTLY-NOTE-002", HttpStatus.FORBIDDEN,    "error.note.permission_denied"),

    // User
    USER_NOT_FOUND           ("NOTLY-USER-001", HttpStatus.NOT_FOUND,    "error.user.not_found"),
    USER_EMAIL_TAKEN         ("NOTLY-USER-002", HttpStatus.CONFLICT,     "error.user.email_taken"),
    USER_USERNAME_TAKEN      ("NOTLY-USER-003", HttpStatus.CONFLICT,     "error.user.username_taken"),

    // Validation
    VALIDATION_FAILED        ("NOTLY-VAL-001",  HttpStatus.BAD_REQUEST,  "error.validation.failed"),

    // System
    INTERNAL_ERROR           ("NOTLY-SYS-001",  HttpStatus.INTERNAL_SERVER_ERROR, "error.system.internal"),
    EXTERNAL_SERVICE_DOWN    ("NOTLY-SYS-002",  HttpStatus.BAD_GATEWAY,           "error.system.external_down"),
    RATE_LIMITED             ("NOTLY-SYS-003",  HttpStatus.TOO_MANY_REQUESTS,     "error.system.rate_limited");

    private final String code;
    private final HttpStatus status;
    private final String messageKey; // resolved via MessageSource
    /* getters */
}
```

Benefits:
- Adding a new error = add an enum entry + a translation row. No new class explosion.
- Codes are stable and grep-able.
- HTTP mapping centralized.

### 4.4 RFC 7807 Problem response

Use Spring's built-in `ProblemDetail`:

```java
ProblemDetail problem = ProblemDetail.forStatusAndDetail(
        status, resolver.resolve(code.getMessageKey(), locale));
problem.setType(URI.create("https://errors.notly.app/" + code.getCode()));
problem.setTitle(code.name());
problem.setProperty("code", code.getCode());
problem.setProperty("traceId", correlationIdProvider.current());
problem.setProperty("timestamp", Instant.now().toString());
problem.setProperty("errors", fieldViolations); // optional
```

Wire example response (single error):
```json
{
  "type": "https://errors.notly.app/NOTLY-AUTH-001",
  "title": "AUTH_INVALID_CREDENTIALS",
  "status": 401,
  "detail": "The email or password you entered is incorrect.",
  "code": "NOTLY-AUTH-001",
  "traceId": "0e1a4f6e-2c1f-43c4-bd0e-2e3a4f6e1c1f",
  "timestamp": "2026-05-11T08:42:10.123Z",
  "instance": "/api/v1/auth/login"
}
```

Wire example (validation):
```json
{
  "type": "https://errors.notly.app/NOTLY-VAL-001",
  "title": "VALIDATION_FAILED",
  "status": 400,
  "detail": "Some fields are invalid.",
  "code": "NOTLY-VAL-001",
  "traceId": "0e1a4f6e-...",
  "timestamp": "2026-05-11T08:42:10.123Z",
  "instance": "/api/v1/auth/register",
  "errors": [
    { "field": "email",    "rejectedValue": "bad",    "code": "Email",    "message": "Invalid email format" },
    { "field": "password", "rejectedValue": "***",    "code": "Size",     "message": "Password must be at least 6 characters" }
  ]
}
```

### 4.5 Expanded `GlobalExceptionHandler`

Handlers (most specific → least specific):

| Order | Exception | Status | Notes |
|------:|-----------|-------:|-------|
| 1 | `BaseException` (sealed) | from `ErrorCode` | Domain exceptions |
| 2 | `MethodArgumentNotValidException` | 400 | `@Valid` on `@RequestBody` |
| 3 | `ConstraintViolationException` | 400 | `@Validated` on params/path |
| 4 | `HandlerMethodValidationException` | 400 | Spring 6.1 method validation |
| 5 | `HttpMessageNotReadableException` | 400 | Malformed JSON |
| 6 | `MissingServletRequestParameterException` | 400 | |
| 7 | `MethodArgumentTypeMismatchException` | 400 | `?id=abc` when `Long` expected |
| 8 | `HttpRequestMethodNotSupportedException` | 405 | |
| 9 | `HttpMediaTypeNotSupportedException` | 415 | |
| 10 | `NoHandlerFoundException` / `NoResourceFoundException` | 404 | |
| 11 | `MaxUploadSizeExceededException` | 413 | |
| 12 | `AuthenticationException` (Spring Security, if reaching MVC) | 401 | Normally handled by `AuthenticationEntryPoint` |
| 13 | `AccessDeniedException` | 403 | Normally handled by `AccessDeniedHandler` |
| 14 | `DataIntegrityViolationException` | 409 | Map FK/unique violations |
| 15 | `OptimisticLockingFailureException` | 409 | |
| 16 | `DataAccessResourceFailureException` | 503 | DB unreachable |
| 17 | `TransactionSystemException` | 500 | |
| 18 | `AsyncRequestTimeoutException` | 503 | |
| 19 | `ResponseStatusException` | from exception | Honor explicit status |
| 20 | `Throwable` (last resort) | 500 | Always returns a `traceId` |

Each handler:
- Logs at the appropriate level
- Sets MDC fields (`errorCode`, `path`, `userId` if available)
- Returns a `ProblemDetail`

### 4.6 Security exception integration

Spring Security exceptions (`AuthenticationException`, `AccessDeniedException`) thrown **inside the filter chain** never reach `@RestControllerAdvice`. Two clean options:

1. **Delegate to MVC**: configure `HandlerExceptionResolver` in the `AuthenticationEntryPoint` / `AccessDeniedHandler` so both paths share the same `ProblemDetail` builder.
2. **Shared formatter bean**: extract a `ProblemDetailFactory` that both the entry point/handler and the `@ExceptionHandler` methods call.

Recommended: option 2 — simpler, no double-handling.

---

## 5. Targeted Fixes to Apply

### 5.1 Delete / consolidate

- **Delete `ResourceAlreadyExistException`** — duplicate of `DuplicateResourceException` and has a typo. Pick one canonical class (recommend `DuplicateResourceException` and split per resource type later, e.g. `DuplicateUserException`).
- **Delete inline `AuthException` inner classes** — promote each to its own top-level class under `domain/auth/` to match the convention used by `BadRequestException` etc.
- **Decide `ValidationException` vs `BadRequestException`** — both map to 400. Keep one. Use `ValidationException` only for *programmatic* validation errors that are not bean-validation (`@Valid`) errors.

### 5.2 `NotlyException` improvements

Replace `HttpStatus status` with `ErrorCode code`. Add:
- `Map<String, Object> context` for log enrichment
- `getUserMessage(Locale)` resolved via `MessageSource`
- Make constructors protected; force subclasses to declare an `ErrorCode`
- For high-volume expected exceptions, optionally override `fillInStackTrace()` to return `this` (skips stack capture)

### 5.3 `GlobalExceptionHandler` improvements

- Add the missing handlers listed in §4.5
- Drop `LocalDateTime.now()` → use `Instant.now()` (UTC)
- Add a correlation ID (read from `MDC.get("traceId")` or `request.getHeader("X-Request-Id")`; generate if absent)
- Use `WARN` for 4xx, `ERROR` for 5xx — never log a stack trace for an expected 4xx
- Return `application/problem+json` content type for error responses
- Map `DataIntegrityViolationException` to a meaningful `ErrorCode` (often `USER_EMAIL_TAKEN` if you let DB unique constraints catch races)
- Stop returning raw `ex.getMessage()` for `NotlyException` — resolve a localized user message from the `ErrorCode`

### 5.4 Logging

Add an `MDC`-aware logging filter (or use Micrometer Tracing). Each request gets:
- `traceId`
- `spanId`
- `userId` (after authentication)
- `path`, `method`

Then every log line during a request carries those automatically. Configure `logback-spring.xml` with `%X{traceId}` etc.

### 5.5 Validation

- Add `@Valid` to controller bodies (currently missing on `AuthController`).
- Add `@Validated` to controller classes and `@RequestParam`/`@PathVariable` annotations for query/path validation. Handle `ConstraintViolationException`.
- Aggregate all field errors and return them as `errors[]` in the problem response.
- Add a constraint message bundle (`ValidationMessages.properties`) for i18n.

### 5.6 Async / scheduled / WebSocket exceptions

- Configure `AsyncUncaughtExceptionHandler` for `@Async` methods.
- Wrap `@Scheduled` method bodies in try/catch + structured log.
- For WebSocket / STOMP, register a `@MessageExceptionHandler` advice.

---

## 6. Performance Considerations

| Concern | Recommendation |
|---------|---------------|
| Stack-trace capture cost on hot-path exceptions | Override `fillInStackTrace()` on validation / auth exceptions OR pre-create singleton instances and rethrow. |
| `LocalDateTime.now()` reflection overhead per error | Switch to `Instant.now()` (UTC, no zone lookup). |
| `MessageSource.getMessage()` lookup per error | Cache resolved messages in a `ConcurrentHashMap<Locale+Key, String>`. |
| Reflection in `@ExceptionHandler` dispatch | Keep the number of handler methods bounded; use type hierarchy instead of duplicating handlers. |
| Logging full DTOs on error | Truncate large fields (passwords, file blobs). Use Logback's `%mask` or structured JSON encoder with redaction. |
| `ConstraintViolation` set iteration | Use streaming + early exit when reporting "first N" violations in the response (cap at e.g. 20). |
| JSON serialization on every error | Configure `ObjectMapper` with `Include.NON_NULL`. Avoid serializing empty `errors[]`. |
| Repeated `LoggerFactory.getLogger` calls | Use `@Slf4j` (Lombok) — already done in `GlobalExceptionHandler`; keep consistent. |
| Eagerly building a stack trace for security exceptions | Spring Security creates many. Filter them in your log appender, or set logger level for security packages to WARN. |

---

## 7. Security Considerations

1. **Never echo internal messages.** Resolve a user-safe localized message from the `ErrorCode` — do not return `ex.getMessage()` for unexpected exceptions. The internal text goes to logs only.
2. **Auth failures should not differentiate "user not found" vs "wrong password".** Both return `AUTH_INVALID_CREDENTIALS`. (Currently OK — `InvalidCredentialsException` is generic.)
3. **Stack traces never go over the wire.** Even in dev, hide them behind a config flag (`notly.errors.include-stack=false` in prod).
4. **Rate-limit error endpoints.** A noisy attacker probing 404s and 500s should hit a circuit breaker.
5. **Mask PII in logs.** Email, IP, tokens — redact via Logback pattern or a custom encoder.
6. **Don't leak DB metadata.** Map `DataIntegrityViolationException` to a friendly code; do not surface constraint names or SQL.
7. **`X-Frame-Options` / `Content-Security-Policy` on error pages.** Spring Security handles this for HTML; for JSON it's not a concern, but verify content type is correct so browsers don't sniff.
8. **CSRF on state-changing endpoints** — separate concern, but related: error responses should not include sensitive headers or cookies.

---

## 8. Testing Strategy

Add tests at every layer:

- **Unit:** `ErrorCode` mapping (every code has a status + message key + translation).
- **Slice:** `@WebMvcTest(GlobalExceptionHandler.class)` — feed each exception type, assert the JSON shape, status, and `code` field.
- **Integration:** trigger each handler via real controllers (`@SpringBootTest` + `MockMvc`). Cover:
  - Missing `@Valid` body → 400 with `errors[]`
  - Type mismatch in `@PathVariable` → 400
  - Auth filter rejects bad JWT → 401 problem+json
  - Method-level `@PreAuthorize` denies → 403 problem+json
  - DB unique constraint violation → 409
  - Unknown route → 404
  - Method not allowed → 405
  - Multipart too large → 413
  - Unexpected `RuntimeException` → 500 with `traceId`
- **Contract:** snapshot tests on a few representative responses so the shape doesn't drift accidentally.
- **Observability:** assert each handler increments the right Micrometer counter (`notly_errors_total{code="NOTLY-AUTH-001"}`).

---

## 9. Migration Plan (Suggested Order)

1. **Add new artifacts side-by-side** (don't delete anything yet):
   - `ErrorCode` enum
   - `ProblemDetailFactory` / `CorrelationIdProvider`
   - New base `BaseException` (parallel to current `NotlyException`)
2. **Migrate `GlobalExceptionHandler`** to use `ProblemDetail` for *new* exceptions; legacy still works.
3. **Add missing handlers** (validation variants, security exceptions, JPA exceptions, framework exceptions).
4. **Introduce MDC + correlation ID** filter; verify `traceId` appears in logs and responses.
5. **Migrate domain exceptions one package at a time** (auth first, then note, then user). Each migration: switch to new base + add to `ErrorCode`.
6. **Delete duplicates and dead code**: `ResourceAlreadyExistException`, `AuthException` inner classes, redundant `ValidationException` if not needed.
7. **i18n**: add `messages_en.properties`, `messages_si.properties`. Resolve via `MessageSource` in the factory.
8. **Add Micrometer counters** per error code.
9. **Lock the hierarchy**: mark `BaseException` as `sealed` once all subclasses are in place.
10. **Write tests** at each step (don't defer to the end).

---

## 10. Quick-Win Checklist (≤ 1-day refactor)

If you can only spend a single day, do these:

- [ ] Delete `ResourceAlreadyExistException.java` (typo + duplicate of `DuplicateResourceException`).
- [ ] Add handlers for: `ConstraintViolationException`, `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException`, `NoHandlerFoundException`, `AccessDeniedException`, `DataIntegrityViolationException`, `MaxUploadSizeExceededException`.
- [ ] Change `log.error` → `log.warn` for all 4xx handlers; never log a stack trace for 4xx.
- [ ] Replace `LocalDateTime.now()` with `Instant.now()`.
- [ ] Add a `traceId` (random UUID per request via a filter) and include it in every error response.
- [ ] Stop returning `ex.getMessage()` for the generic `Exception` handler — return a fixed "An unexpected error occurred. Reference: {traceId}".
- [ ] Add `@Valid` to all `@RequestBody` parameters across controllers.

These alone close ~80% of the gap with industry-grade exception handling.

---

## 11. Anti-Patterns to Avoid

- ❌ Throwing `RuntimeException("...")` with a string message. Always use a typed exception with an `ErrorCode`.
- ❌ Catching `Exception` in service / controller code and re-throwing as something generic. Let the global handler do its job.
- ❌ Returning HTTP 200 with `success: false` (you don't do this, just noting).
- ❌ Encoding error info in HTTP headers only — clients miss it.
- ❌ Logging full request body on error (PII, secrets).
- ❌ Different error envelope per endpoint.
- ❌ `try/catch (Exception ignored) {}` — silently swallows bugs.
- ❌ `e.printStackTrace()` — bypasses the logging framework, breaks log shipping.
- ❌ One handler per micro-exception when a parent suffices — keep `BaseException` as the main entry point.
- ❌ Encoding business meaning in the HTTP status alone (`409` could mean ten different things — give it a `code`).

---

## 12. References

- **RFC 7807** — Problem Details for HTTP APIs (and successor **RFC 9457**)
- **Spring Boot 3 / Framework 6** — `ProblemDetail`, `ErrorResponse`, `ErrorResponseException`
- **Micrometer Tracing** — propagation of `traceId` / `spanId`
- **Resilience4j** — for retry/circuit-breaker errors that also need uniform mapping
- **Bean Validation (Jakarta)** — `@Valid`, `@Validated`, message bundles
- **OWASP API Security Top 10** — guidance on safe error responses

---

## 13. Final Summary

The current exception layer is functional but lives at the "tutorial" maturity level: simple base class, three handlers, free-text messages. An expert-level design adds:

1. **Stable error codes** (machine-readable, locale-independent).
2. **RFC 7807 envelopes** via `ProblemDetail`.
3. **Correlation IDs** in every response and log line.
4. **Comprehensive handler coverage** for Spring, JPA, and Security exceptions.
5. **Sealed type hierarchy** for compile-time safety.
6. **i18n-ready** user-facing messages, separated from developer messages.
7. **Right log levels** (4xx = WARN, 5xx = ERROR).
8. **Metrics** per error code (alerting + dashboards).
9. **Performance discipline** (no stack traces for hot-path expected exceptions).
10. **Security discipline** (never leak internals; mask PII).

Adopt incrementally using the migration plan in §9. Even the quick-win checklist in §10 is a meaningful upgrade in one focused day of work.
