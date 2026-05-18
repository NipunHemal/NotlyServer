# Notly — Viva Preparation Notes

> A complete backend walkthrough for the **Notly** final-year project viva.
> Every section explains **what** it is, **why** we use it (theory), and **how** it is used in the project, plus likely viva questions you can answer confidently.

---

## 1. Project Overview

### 1.1 What is Notly?
**Notly** is a personal note-taking and organization platform (similar to Notion / Google Keep / Evernote) built as a full-stack application. This repository (`NotlyServer`) is the **backend REST API** written in **Java with Spring Boot**.

### 1.2 Core Features
| # | Feature | Short description |
|---|---------|-------------------|
| 1 | **Authentication** | Email/password + Google OAuth2 login, JWT-based stateless sessions |
| 2 | **Workspaces → Groups → Notes** | 3-level hierarchy (Workspace owns Groups; Groups can be nested and contain Notes) |
| 3 | **Note CRUD + autosave** | Create, read, update, delete; debounced autosave with version snapshots |
| 4 | **Version history** | Every meaningful change is stored as a `NoteVersion`; user can restore old versions |
| 5 | **Move / Copy / Duplicate** | Re-arrange notes across groups |
| 6 | **Favorites** | Quick-access favorites list |
| 7 | **Lock / Unlock** | Password-protect a note or a group; unlock issues a short-lived JWT (X-Unlock-Token) |
| 8 | **Soft delete + Recycle Bin** | 30-day retention before permanent deletion |
| 9 | **Scheduled auto-purge** | Cron job that hard-deletes expired bin items every day at 03:00 |
| 10 | **Public sharing** | Share a note via a unique `share_token` for read-only access |
| 11 | **Collaborators** | Invite other users to a note/group with permission roles |
| 12 | **Reminders + Notifications** | Email notifications (Spring Mail / Gmail SMTP) |
| 13 | **Activity Log** | Records every important action for audit |
| 14 | **Rate Limiting** | Token-bucket per IP / per user via Bucket4j |
| 15 | **Global Exception Handling** | Uniform RFC 7807-style error responses |
| 16 | **API Documentation** | Auto-generated Swagger / OpenAPI 3 UI |

### 1.3 High-Level Architecture
```
[ Client (Web / Mobile) ]
            │
            │ HTTPS + JWT (Bearer)
            ▼
┌────────────────────────────────────────────────────────────────┐
│                     Spring Boot Backend                        │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐ │
│  │Controller│→ │Service (impl)│→ │Repository │→ │PostgreSQL  │ │
│  └──────────┘  └──────────────┘  └───────────┘  └────────────┘ │
│        ▲                                                       │
│   Filters: RateLimitingFilter → JwtAuthenticationFilter        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  Google OAuth2 + Gmail SMTP
```
Standard **Layered (N-tier) Architecture** — Controller → Service → Repository → Database.

---

## 2. Tech Stack & Why

| Technology | Why it is used (theory) |
|-----------|--------------------------|
| **Java 21** | Modern LTS, supports records, sealed classes, virtual threads — fast and stable. |
| **Spring Boot 3.5** | Convention-over-configuration, embedded Tomcat, auto-configuration, dependency injection (IoC), large ecosystem. |
| **Spring Web (MVC)** | Build REST APIs using `@RestController`, `@RequestMapping`. |
| **Spring Data JPA + Hibernate** | ORM — maps Java objects to DB tables, removes raw SQL, supports caching and lazy loading. |
| **PostgreSQL** | ACID-compliant relational DB, supports JSONB, full-text search (`tsvector`), strong indexing. |
| **Spring Security** | Filter-chain authentication/authorization framework. Handles CORS, CSRF, sessions. |
| **JWT (jjwt 0.11.5)** | Stateless authentication. No server-side session storage; horizontally scalable. |
| **OAuth2 (Google)** | Third-party login — improves UX, removes password burden. |
| **BCrypt** | One-way password hashing (salt + adaptive cost). |
| **MapStruct** | Compile-time DTO ↔ Entity mapping. Faster than reflection-based libraries (ModelMapper). |
| **Lombok** | Removes boilerplate (`@Getter`, `@Setter`, `@RequiredArgsConstructor`). |
| **Bucket4j** | Token-bucket rate-limiting algorithm. |
| **Springdoc OpenAPI** | Auto-generates Swagger UI from annotations. |
| **Spring Mail (Gmail SMTP)** | Sends transactional emails (reminders, notifications). |
| **Spring Scheduling (`@Scheduled`)** | Cron job that purges expired bin items. |
| **Maven** | Build/dependency manager. |

---

## 3. Project Structure (Layered)

```
lk.hemal.notly
 ├── NotlyServerApplication.java    ← @SpringBootApplication, @EnableScheduling
 ├── config/                        ← Beans, security, OAuth, OpenAPI, rate-limit, email
 │    └── security/                 ← SecurityConfig, ApplicationConfig
 ├── controller/                    ← REST endpoints (Auth, Note, Group, Workspace, Bin, etc.)
 ├── core/enums/                    ← Domain enums (Visibility, PermissionRole, ItemStatus, …)
 ├── dto/                           ← Request & Response objects (validation lives here)
 ├── entity/                        ← JPA entities (DB tables)
 ├── exception/                     ← ErrorCode, ErrorResponse, GlobalExceptionHandler
 ├── mapper/                        ← MapStruct interfaces (Entity ↔ DTO)
 ├── repo/                          ← Spring Data JPA repositories
 ├── scheduler/                     ← BinPurgeScheduler
 ├── security/                      ← JwtAuthenticationFilter, RateLimitingFilter
 ├── service/                       ← Interfaces
 │    └── impl/                     ← Service implementations (business logic)
 └── util/                          ← JwtUtil, ContentHashUtil
```

### Why layered?
1. **Separation of concerns** — controllers only handle HTTP; services handle business; repos handle DB.
2. **Testability** — each layer can be mocked.
3. **Maintainability** — easier to change a single layer (e.g. switch DB) without breaking others.

---

## 4. Detailed Backend Breakdown

### 4.1 Entry Point: `NotlyServerApplication`
```java
@SpringBootApplication        // = @Configuration + @EnableAutoConfiguration + @ComponentScan
@EnableScheduling             // activates @Scheduled jobs (bin purge)
@EnableConfigurationProperties(RateLimitProperties.class)
```
- `@SpringBootApplication` triggers Spring Boot auto-configuration.
- `@EnableScheduling` is mandatory for the bin-purge cron job.

---

### 4.2 Configuration Layer (`config/`)

| Class | Purpose |
|-------|---------|
| `ApiConfig` | Stores constants: `API_BASE_PATH = "/api/v1"`, allowed origins, allowed methods, allowed headers. Single source of truth for API versioning. |
| `OpenApiConfig` | Swagger UI metadata (title, version). |
| `GoogleOAuthConfig` | Reads `google.oauth.*` from `application.yml`. |
| `EmailConfig` / `MailSenderConfig` | Configures `JavaMailSender` bean for Gmail SMTP. |
| `RateLimitProperties` | Type-safe `@ConfigurationProperties` for tiered rate-limit rules. |
| `security/SecurityConfig` | The most important class — see §4.5. |
| `security/ApplicationConfig` | Provides `AuthenticationManager`, `PasswordEncoder` (BCrypt). |

**Theory — `@Configuration` & `@Bean`**
`@Configuration` marks a class as a source of Spring beans; `@Bean` methods return objects that the IoC container manages.

---

### 4.3 Entity Layer (`entity/`)

All entities extend `BaseEntity`, which provides:
- `UUID id` — generated automatically.
- `createdAt` — auto-filled via `@CreationTimestamp`.
- `updatedAt` — auto-filled via `@UpdateTimestamp`.

#### Important entities

| Entity | Highlights |
|--------|-----------|
| `User` | Implements `UserDetails` (Spring Security). Holds `passwordHash`, `oauthProvider`, `role`, `currentRefreshToken`. |
| `Workspace` | Belongs to a `User` (owner). Has many `Group`s. |
| `Group` | Belongs to a `Workspace`. Self-referencing parent/children → tree structure. Lockable. |
| `Note` | Belongs to a `Group` and a `User` (owner). Has `content`, `contentJson`, `version_number`, `lock_version` (optimistic locking via `@Version`), `is_locked`, `share_token`, soft-delete fields. |
| `NoteVersion` | Snapshot of a note at a point in time (version history). |
| `NoteTag` | Many-to-many style tagging. |
| `NoteMedia` | Attached files / images. |
| `Reminder` | Time-based reminders → email notifications. |
| `Collaborator` / `GroupCollaborator` | Sharing with other users (with `PermissionRole`). |
| `Friend` | Friend / connection list. |
| `ActivityLog` | Audit trail (who did what, when). |
| `BinItem` | Recycle-bin record — points to soft-deleted Note or Group with a `restore_deadline`. |

#### Key JPA / Hibernate Concepts in this project

1. **`@Entity` + `@Table`** — maps a class to a DB table.
2. **`@Id` + `@GeneratedValue(strategy = UUID)`** — UUID primary keys (better than sequential IDs for distributed systems and to prevent ID enumeration attacks).
3. **`@ManyToOne(fetch = LAZY)`** — relationship loaded on demand → avoids N+1 surprises and reduces memory.
4. **`@Enumerated(EnumType.STRING)`** — saves enum as string (readable, refactor-safe).
5. **Soft delete via `@SQLDelete` + `@SQLRestriction`** —
   - `@SQLDelete(sql = "UPDATE notes SET deleted_at = NOW() WHERE id = ?")` overrides `EntityManager.remove()`.
   - `@SQLRestriction("deleted_at IS NULL")` filters every SELECT automatically.
   - Result: deleted rows stay in DB but are invisible — supports recycle bin.
6. **Optimistic locking via `@Version private Long lockVersion`** — prevents lost updates when two clients edit the same note. Hibernate auto-increments and throws `OptimisticLockException` if stale.
7. **Indexes** — declared on entity (`@Index(name="idx_notes_owner", columnList="owner_id")`) for fast lookup.
8. **`@JdbcTypeCode(SqlTypes.JSON)`** — maps a `String` field to a Postgres JSONB column (for rich content).

---

### 4.4 Repository Layer (`repo/`)

Each repo extends `JpaRepository<Entity, UUID>` → automatically gives `findById`, `save`, `delete`, `findAll`, paging, sorting.

Custom queries use:
- **Query methods**: `findByOwnerIdAndStatus(UUID, NoteStatus)` — Spring derives the SQL from the method name.
- **`@Query` JPQL** — for complex joins / projections.
- **`@Modifying @Query`** for `UPDATE` / `DELETE` (e.g. `hardDelete` bypasses soft-delete).

**Theory — Repository Pattern**
Encapsulates data access. Acts as an in-memory collection abstraction over the DB so the service layer never touches SQL directly.

---

### 4.5 Security Layer

#### 4.5.1 `SecurityConfig`
- **`csrf().disable()`** — REST APIs are stateless (CSRF protects session-cookies, irrelevant for JWT).
- **CORS** — configured via `CorsConfigurationSource` from `ApiConfig`.
- **`sessionCreationPolicy(STATELESS)`** — Spring will not create `HttpSession`s. Every request must carry its own JWT.
- **`authorizeHttpRequests`** —
  - `permitAll`: `/auth/**`, `/oauth2/**`, `/notes/public/**`, Swagger, health.
  - `authenticated`: everything under `/notes/**`, `/groups/**`, etc.
  - `hasAuthority("ADMIN")`: `/admin/**`.
- **Filter chain ordering** (very common viva question):
  1. `RateLimitingFilter` (added **before** `UsernamePasswordAuthenticationFilter`)
  2. `JwtAuthenticationFilter` (added **before** `UsernamePasswordAuthenticationFilter`)
  3. Spring Security default filters.
- **`@EnableMethodSecurity`** — allows `@PreAuthorize("hasRole('ADMIN')")` on methods.
- Custom `authenticationEntryPoint` (401) and `accessDeniedHandler` (403) write JSON instead of HTML.

#### 4.5.2 `JwtAuthenticationFilter` (extends `OncePerRequestFilter`)
1. Extract `Authorization: Bearer <token>` header.
2. Validate with `JwtUtil.isTokenValid(token)`.
3. Extract user ID (`sub` claim) → load `UserDetails` via `CustomUserDetailsService.loadUserById`.
4. Build `UsernamePasswordAuthenticationToken` and place it in `SecurityContextHolder`.
5. `shouldNotFilter` skips public paths and Swagger.

**Theory — `OncePerRequestFilter`** guarantees this filter runs exactly once per request, even across forwards/includes.

#### 4.5.3 `JwtUtil`
- HMAC-SHA256 signing key built from a Base64 secret in `application.yml`.
- Generates three token types: **ACCESS**, **REFRESH**, **UNLOCK**.
- Adds custom claims: `email`, `role`, `type`, plus `ent` + `eid` for unlock tokens.
- Provides validation methods (`isTokenValid`, `isRefreshToken`, `isUnlockTokenValid`).

**JWT structure:**
```
HEADER.PAYLOAD.SIGNATURE
{alg,typ}.{sub, iat, exp, custom claims}.HMACSHA256(...)
```

#### 4.5.4 `RateLimitingFilter` + Bucket4j
- Resolves a **tier** from request path (`public`, `api`, `heavy`, `sensitive`).
- Resolves a **client key** = `user:<id>` if authenticated, else `ip:<X-Forwarded-For|X-Real-IP|remoteAddr>`.
- Each tier has its own capacity/refill rules in `application.yml`.
- Adds standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Retry-After`.
- On rejection, returns **HTTP 429** with JSON body.

**Theory — Token-bucket algorithm**
A bucket has a fixed capacity. Tokens refill at a constant rate. Each request consumes one. If empty → reject. Allows short bursts while limiting sustained rate.

---

### 4.6 Authentication Flow

#### 4.6.1 Register
```
POST /api/v1/auth/register
  → validate DTO (@Valid)
  → check email/username uniqueness
  → hash password with BCrypt
  → save User
  → generate ACCESS + REFRESH tokens
  → return AuthResponseDto
```

#### 4.6.2 Login
```
POST /api/v1/auth/login
  → AuthenticationManager.authenticate(usernamePasswordToken)
  → on success: generate tokens, persist refresh token in user.currentRefreshToken
```

#### 4.6.3 Refresh (Token Rotation)
```
POST /api/v1/auth/refresh
  → verify refresh token signature + match with stored value
  → issue NEW access + NEW refresh
  → invalidate old refresh (rotation prevents replay)
```

#### 4.6.4 Logout
- Clears `user.currentRefreshToken` so old refresh tokens cannot be used.
- Access token remains valid until expiry (stateless trade-off).

#### 4.6.5 Google OAuth2
```
Client → Google login UI → receives auth code
Client → POST /api/v1/auth/google { code }
Server  → exchange code with Google token endpoint
        → fetch user-info
        → create or link user
        → issue Notly JWTs
```

#### 4.6.6 Unlock Token (for locked notes/groups)
- User submits the lock password.
- Server returns a 2-hour `UNLOCK` JWT scoped to that entity (`ent`, `eid` claims).
- Client sends it via `X-Unlock-Token` header to access the locked resource.

---

### 4.7 Controller Layer
Examples:
- `AuthController` — login, register, refresh, logout, Google login.
- `NoteController` — full CRUD + autosave, versions, archive/unarchive, move, copy, duplicate, public link, favorite toggle.
- `GroupController`, `WorkspaceController`, `BinController`, `FavoritesController`, `UserController`, `ActivityLogController`.
- `PublicNoteController` — read-only public-share endpoint.

**Standard patterns:**
- `@RestController` = `@Controller` + `@ResponseBody`.
- `@RequestMapping(ApiConfig.API_BASE_PATH + "/notes")` — centralized base path.
- `@AuthenticationPrincipal User user` — injects the authenticated user directly.
- DTOs validated with `@Valid` and Jakarta validation annotations (`@NotBlank`, `@Email`, `@Size`).
- Swagger/OpenAPI annotations: `@Tag`, `@Operation`, `@ApiResponses`.

---

### 4.8 Service Layer (`service/` + `service/impl/`)
Interface + implementation pattern → polymorphism + easy mocking in unit tests.

Examples of business logic implemented here:
- **`NoteServiceImpl`** — creates notes, calculates `contentHash`, decides when to write a `NoteVersion`, enforces lock, performs soft delete, moves between groups, copies/duplicates, manages share tokens.
- **`AuthServiceImpl`** — register/login/refresh/logout, BCrypt hashing, JWT issuance.
- **`BinServiceImpl` / `BinItemServiceImpl`** — manage recycle bin records and restore logic.
- **`LockAttemptServiceImpl`** — tracks failed unlock attempts (brute-force protection).
- **`ActivityLogServiceImpl`** — records actions for audit.
- **`GoogleEmailServiceImpl` / `NoOpEmailServiceImpl`** — strategy pattern; the active one depends on `email.enabled` in YAML.

**Theory — `@Transactional`**
Wraps a method in a DB transaction. If any unchecked exception is thrown → automatic rollback. Ensures consistency across multi-step DB operations (e.g. delete note + insert bin item).

---

### 4.9 DTO + Mapper Layer
- **DTOs** isolate the API contract from JPA entities (don't leak DB fields, prevent over-posting attacks).
- **MapStruct** generates type-safe mappers at compile time. Example:
  ```java
  @Mapper(componentModel = "spring")
  public interface NoteMapper {
      NoteResponse toResponse(Note note);
      Note toEntity(CreateNoteRequest req);
  }
  ```
- Faster and safer than reflection (ModelMapper).

---

### 4.10 Exception Handling

#### `NotlyException` + `ErrorCode` enum
Every business error has a stable code (e.g. `NOTE_001`, `AUTH_002`) and a default message + HTTP status. Easy for the frontend to localize.

#### `GlobalExceptionHandler` (`@RestControllerAdvice`)
- `NotlyException` → maps to its `ErrorCode` (status + code).
- `MethodArgumentNotValidException` → returns field-by-field validation errors.
- Generic `Exception` → returns 500 with a UUID `traceId` so support can correlate the log.

**Theory — `@RestControllerAdvice`**
Cross-cutting controller advice that catches exceptions from any `@RestController` and returns a uniform error JSON.

---

### 4.11 Recycle Bin & Scheduler

#### Bin flow
1. User deletes note/group → service performs soft delete (`@SQLDelete`).
2. A `BinItem` row is inserted with `restore_deadline = now + 30 days`.
3. User can list bin items, restore individual items, or empty the bin.

#### `BinPurgeScheduler`
- `@Scheduled(cron = "0 0 3 * * *")` — runs daily at 03:00.
- Finds bin items past `restore_deadline`.
- Cascades hard delete: deletes collaborators, reminders, tags, media, activity logs, then the entity itself.
- Wrapped in `@Transactional` so a failure rolls back.

---

### 4.12 Rate Limiting Tiers (`application.yml`)
| Tier | Capacity | Burst | Used for |
|------|----------|-------|----------|
| `public` | 20 / min | 30 | Public/unauthenticated endpoints |
| `api` | 100 / min | 150 | Authenticated default |
| `heavy` | 10 / min | 15 | Search, export |
| `sensitive` | 5 / min | 8 | Password change, account delete, forgot/reset |

---

### 4.13 Email & Notifications
- `EmailService` interface with two implementations:
  - `GoogleEmailServiceImpl` — real Gmail SMTP.
  - `NoOpEmailServiceImpl` — silent stub for local dev (`email.enabled: false`).
- Used for reminders, account verification, and other transactional emails.

---

### 4.14 API Documentation (Swagger)
- Auto-generated at:
  - JSON spec: `/v3/api-docs`
  - UI: `/swagger-ui.html`
- Each endpoint annotated with `@Operation`, `@ApiResponse`, `@Tag`.
- Helps frontend and viva demo — you can show APIs live.

---

## 5. Database Design (key relationships)

```
User 1──n Workspace 1──n Group 1──n (self) Group   ← nested folders
                                  └──n Note
Note 1──n NoteVersion
Note 1──n NoteTag
Note 1──n NoteMedia
Note 1──n Reminder
Note n──n User  (via Collaborator)
Group n──n User (via GroupCollaborator)
User 1──n ActivityLog
User 1──n BinItem
```

- All tables use **UUID primary keys**.
- All entities inherit `created_at` / `updated_at`.
- Sensitive columns (`password_hash`, `lock_password_hash`) store **BCrypt hashes**, never plaintext.
- Indexes added on FKs (`owner_id`, `group_id`, `workspace_id`) and on frequently filtered columns (`status`, `deleted_at`, `restore_deadline`).

---

## 6. Likely Viva Questions & Answers

### General
**Q: What problem does Notly solve?**
A: It is a centralized note-taking platform that organizes notes into workspaces and nested groups, supports collaboration, security features like locking and rate limiting, and full version history for accidental edits.

**Q: Why Spring Boot?**
A: Auto-configuration, embedded server, huge ecosystem (Security, Data, Mail), production-ready features like Actuator, and faster development thanks to convention-over-configuration.

**Q: Why PostgreSQL?**
A: ACID compliance, mature, supports JSONB for rich content, full-text search via `tsvector`, and powerful indexing.

### Architecture
**Q: Explain the layered architecture.**
A: Controller (HTTP) → Service (business) → Repository (data) → Database. Each layer has one responsibility; layers communicate via interfaces, which makes the code testable and maintainable.

**Q: What is dependency injection? How is it used here?**
A: A design pattern where the framework provides required objects instead of the class creating them. Spring's IoC container injects services into controllers and repos into services using `@RequiredArgsConstructor` constructor injection.

### Security
**Q: How does JWT authentication work in Notly?**
A: On login the server signs a JWT containing `sub` (user id), `email`, `role`, `type=ACCESS`. The client sends it in `Authorization: Bearer`. The `JwtAuthenticationFilter` validates it on every request and sets the `SecurityContext`. Stateless — no session on the server.

**Q: Access token vs refresh token?**
A: Access token is short-lived (15 min) and used in every API call. Refresh token is long-lived (7 days), used only to obtain a new access token, and is rotated on every refresh. Stored on the user row, so logout simply clears it.

**Q: How are passwords stored?**
A: As BCrypt hashes — salted, adaptive (cost parameter) — never in plaintext.

**Q: What protects against brute force?**
A: `LockAttemptService` counts failed unlock attempts, and `RateLimitingFilter` enforces a 5/min limit on sensitive endpoints.

**Q: How is CSRF handled?**
A: Disabled, because the API is stateless (no cookie-based session) and uses Bearer tokens. CSRF mainly attacks cookie sessions.

**Q: How is CORS configured?**
A: `corsConfigurationSource` allows specific origins (`localhost:3000`, `localhost:9002`), specified methods and headers, and `allowCredentials = true`.

### JPA / Database
**Q: What is `@Version` / optimistic locking?**
A: A version column auto-incremented on update. If two transactions read the same row and both try to save, the second one fails with `OptimisticLockException`. Used on `Note` to prevent autosave conflicts.

**Q: Soft delete — how is it implemented?**
A: `@SQLDelete` rewrites `DELETE` into `UPDATE notes SET deleted_at = NOW()`. `@SQLRestriction("deleted_at IS NULL")` automatically filters every SELECT, so deleted rows look gone but stay in DB for 30 days.

**Q: What is N+1 problem and how do you avoid it?**
A: When loading a list, each parent triggers another query for its children. Solved with `fetch = LAZY` plus explicit `JOIN FETCH` queries or DTO projections.

**Q: Lazy vs Eager fetching?**
A: Lazy = load related entity only when accessed. Eager = load immediately. We default to LAZY to avoid unnecessary queries and memory load.

### REST API
**Q: What HTTP methods do you use and why?**
A: `GET` (read), `POST` (create / actions like move/copy), `PATCH` (partial update — autosave), `PUT` (full update), `DELETE` (remove). Statuses: 200, 201, 204, 400, 401, 403, 404, 409, 429, 500.

**Q: Why DTOs?**
A: Decouple API contract from DB entities, prevent over-posting, allow versioning, and let us validate input.

### Other
**Q: How does rate limiting work?**
A: Bucket4j token-bucket: each client/tier has a bucket with capacity + refill rate. Each request consumes a token. If empty → HTTP 429 with `X-RateLimit-*` headers.

**Q: How is Swagger generated?**
A: Springdoc scans `@RestController` classes and Jakarta validation annotations and exposes `/v3/api-docs` and `/swagger-ui.html` automatically.

**Q: How does the bin auto-purge work?**
A: A `@Scheduled` cron at 03:00 daily reads expired `BinItem`s and cascades a hard delete through collaborators, reminders, tags, media, activity logs, then the entity, inside `@Transactional`.

**Q: How do you handle errors uniformly?**
A: All business errors throw `NotlyException(ErrorCode)`. A `@RestControllerAdvice` catches them and returns an `ErrorResponse { code, status, message, timestamp, traceId, fieldErrors }`.

---

## 7. Quick Reference: Important Annotations

| Annotation | Meaning |
|------------|---------|
| `@SpringBootApplication` | Marks the main class; combines `@Configuration`, `@EnableAutoConfiguration`, `@ComponentScan`. |
| `@RestController` | Controller whose methods return JSON (not views). |
| `@RequestMapping` | Maps a URL/method to a class/method. |
| `@GetMapping/@PostMapping/...` | Shortcuts for `@RequestMapping(method=...)`. |
| `@RequestBody` / `@PathVariable` / `@RequestParam` | Binds HTTP body / URL path / query string. |
| `@Valid` | Triggers DTO validation. |
| `@AuthenticationPrincipal` | Injects current authenticated user. |
| `@Service`, `@Repository`, `@Component` | Stereotype beans for IoC. |
| `@Transactional` | Wraps method in a DB transaction. |
| `@Entity`, `@Table`, `@Id`, `@Column` | JPA mapping. |
| `@OneToMany`, `@ManyToOne`, `@JoinColumn` | JPA relationships. |
| `@Version` | Optimistic locking. |
| `@SQLDelete`, `@SQLRestriction` | Hibernate soft-delete. |
| `@EnableScheduling`, `@Scheduled` | Cron-style jobs. |
| `@RestControllerAdvice`, `@ExceptionHandler` | Global error handling. |
| `@ConfigurationProperties` | Type-safe binding of `application.yml`. |
| `@PreAuthorize` | Method-level role / SpEL security. |

---

## 8. Demo Script (5-minute viva walk-through)

1. **Show Swagger UI** at `http://localhost:8080/swagger-ui.html` — point to grouped tags (Auth, Notes, Groups, Bin, etc.).
2. **Register** a user → show JWT in response.
3. **Login** → copy access token → authorize Swagger.
4. **Create workspace → create group → create note**.
5. **Update note** → show that a new `NoteVersion` was created.
6. **Lock the note** → try to GET → 403 → unlock → GET with `X-Unlock-Token` → 200.
7. **Soft delete** the note → show it appears in `/bin` → restore it.
8. **Hit rate-limit** by spamming `/auth/login` 6 times → show HTTP 429 + headers.
9. **Trigger validation error** (e.g. empty title) → show field errors response.
10. Mention: cron-based bin purge runs daily at 03:00.

---

## 9. One-Liner Summary for the Examiner

> *Notly is a Spring Boot 3 + PostgreSQL backend providing a secure, stateless REST API for hierarchical note management — workspaces, nested groups, notes with autosave and version history, soft delete with a 30-day recycle bin auto-purge, password-protected lock/unlock, public sharing, collaborators, email reminders, and tiered rate limiting — secured with JWT + Google OAuth2 and documented via OpenAPI 3.*

Good luck! 🍀
