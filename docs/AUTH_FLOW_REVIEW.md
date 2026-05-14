# Authentication Flow — Code Review

**Project:** Notly Server (Spring Boot, JWT-based authentication)
**Reviewed branch:** `development`
**Review date:** 2026-05-10
**Reviewer scope:** Authentication & authorization layer only (register, login, JWT issuing, JWT filtering, security config, related DTOs/exceptions/configuration).

> This document is **review-only**. It identifies strengths, gaps, bugs, and recommended improvements. **No code is changed** as part of this review.

---

## 1. Files Reviewed

| Layer | File |
|-------|------|
| Controller | `controller/AuthController.java` |
| Service (interface) | `service/AuthService.java` |
| Service (impl) | `service/impl/AuthServiceImpl.java` |
| User Details | `service/CustomUserDetailsService.java`, `service/impl/CustomUserDetailsServiceImpl.java` |
| Security filter | `security/JwtAuthenticationFilter.java` |
| JWT util | `util/JwtUtil.java` |
| Security config | `config/security/SecurityConfig.java`, `config/security/ApplicationConfig.java` |
| API config | `config/ApiConfig.java` |
| Entity | `entity/User.java`, `entity/BaseEntity.java` |
| DTOs | `dto/request/RegisterRequestDto.java`, `dto/request/LoginRequestDto.java`, `dto/request/RefreshRequestDto.java`, `dto/response/AuthResponseDto.java`, `dto/response/UserResponseDto.java` |
| Exceptions | `exception/AuthException.java`, `exception/GlobalExceptionHandler.java` |
| Repo | `repo/UserRepo.java` |
| Application config | `resources/application.yml` |

---

## 2. High-Level Flow Summary

### 2.1 Register flow
1. `POST /api/v1/auth/register` → `AuthController.register()`
2. `AuthServiceImpl.register()`:
   - Checks duplicate username → throws `UsernameAlreadyExistsException`
   - Checks duplicate email → throws `EmailAlreadyExistsException`
   - Encodes password with `BCryptPasswordEncoder(strength=12)`
   - Persists `User` (default `role=USER`, `isActive=true`)
   - Returns `AuthResponseDto(accessToken, refreshToken, user)`

### 2.2 Login flow
1. `POST /api/v1/auth/login` → `AuthController.authLogin()`
2. `AuthServiceImpl.login()`:
   - Delegates to `AuthenticationManager` → `DaoAuthenticationProvider` → `CustomUserDetailsServiceImpl.loadUserByUsername()` → BCrypt `matches()`
   - Maps `BadCredentials/Disabled/Locked` exceptions to `AuthException` variants
   - Re-fetches user via `findByEmailOrUsername` and issues access + refresh JWTs

### 2.3 Request authorization flow
1. Each request hits `JwtAuthenticationFilter` (a `OncePerRequestFilter`)
2. Filter is **skipped** for `/api/v1/auth/**`, OAuth2 paths, public note paths, and `/actuator/health`
3. For other paths it extracts `Authorization: Bearer <token>`, validates signature/expiry, and loads `UserDetails` by `userId` (subject)
4. `SecurityContextHolder` is populated with a `UsernamePasswordAuthenticationToken`
5. `SecurityConfig` enforces role-based rules (`/admin/**` = ADMIN, `/notes/**` = USER, others authenticated)

---

## 3. Strengths

These are good practices already in place — keep them:

1. **Stateless session policy** — `SessionCreationPolicy.STATELESS` is correctly set; no JSESSIONID created.
2. **CSRF disabled correctly** for a stateless JWT API.
3. **Strong BCrypt cost factor** — strength `12` is a sane modern default.
4. **`OncePerRequestFilter`** — correct base class for the JWT filter (avoids double-filtering on async dispatch).
5. **`shouldNotFilter()` skip-list** — short-circuits public endpoints cleanly instead of validating tokens that won't be present.
6. **Symmetric structure for access/refresh tokens** — separate `type` claim distinguishes them at parse time.
7. **`UserDetails` implemented on the `User` entity** — simple and works with `DaoAuthenticationProvider`.
8. **Custom exception hierarchy** (`AuthException`) with HTTP statuses — maps cleanly through `GlobalExceptionHandler`.
9. **Composable role checks via `@EnableMethodSecurity`** — method-level `@PreAuthorize` is available where needed.
10. **JSON error responses** for `authenticationEntryPoint` and `accessDeniedHandler` — clients receive structured 401/403 instead of HTML.

---

## 4. Issues & Improvement Notes

> Numbered for traceability. Severity: **CRITICAL / HIGH / MEDIUM / LOW / NIT.**
> No fixes are made here — these are notes for future implementation.

### 4.1 Secrets & Configuration

#### [CRITICAL] DB credentials and JWT secret are committed in `application.yml`
- `spring.datasource.password: s7jt6gEqsUQ1wcBz9hDm` and `jwt.secret: "mySecretkey..."` sit in plaintext under `src/main/resources/application.yml` and will be tracked by git.
- **Note:** Move to environment variables or an external secrets manager (`${DB_PASSWORD}`, `${JWT_SECRET}`). Rotate the current values since they're already in git history. Add `application-local.yml` to `.gitignore`.

#### [HIGH] JWT secret is a low-entropy repeating string
- `"mySecretkey1234dew4"` repeated five times. Although it satisfies the 256-bit length for HS256, the entropy is far below random.
- **Note:** Replace with a cryptographically-random base64 secret (`openssl rand -base64 64`). Treat as an immediate security action when rotating.

#### [MEDIUM] `ApiConfig` hard-codes CORS origins
- `allowedOrigins`, `allowedMethods`, `allowedHeaders` are `final` arrays with literal values. The class is annotated `@Configuration` but exposes no `@Value` bindings, so `application.yml` cannot override per-environment.
- **Note:** Bind via `@ConfigurationProperties(prefix = "api")` so dev/staging/prod can supply different origins. Wildcard origins with `allowCredentials=true` are currently safe because explicit origins are listed — keep that invariant.

### 4.2 Register Flow

#### [HIGH] `displayName` fallback logic is inverted (bug)
- `AuthServiceImpl.register()`:
  ```java
  .displayName(req.getDisplayName().isEmpty() ? req.getDisplayName() : req.getUsername())
  ```
  When the client provides a non-empty display name, this picks the **username** instead. The condition is the wrong way around.
- **Note:** Should be `req.getDisplayName().isEmpty() ? req.getUsername() : req.getDisplayName()`. Also call `isBlank()` rather than `isEmpty()` to handle whitespace, and null-check `getDisplayName()` first to avoid `NullPointerException` when the client omits the field.

#### [HIGH] No `@Valid` on request body
- `AuthController.register()` and `authLogin()` do **not** annotate the body with `@Valid`. The `@NotBlank`, `@Email`, `@Size` annotations on `RegisterRequestDto` / `LoginRequestDto` are therefore never enforced — `MethodArgumentNotValidException` will not fire.
- **Note:** Add `@Valid` to both `@RequestBody` parameters so `GlobalExceptionHandler.handleValidationErrors` can return structured 400 responses.

#### [MEDIUM] Email/username are not normalized on register or lookup
- The commented-out `TempAuthService` lowercased email/username before persisting; the live `AuthServiceImpl` does not.
- Without normalization, `Alice@x.com` and `alice@x.com` register as different accounts, and `findByEmailOrUsername` becomes case-sensitive depending on the DB collation.
- **Note:** Lowercase email at write and read; either lowercase username or document a case-insensitive policy and enforce it in the repo query (`LOWER(u.email)` / `LOWER(u.username)`).

#### [MEDIUM] Password policy is weak
- `@Size(min = 6)` on `RegisterRequestDto.password` is the only constraint. No upper bound (BCrypt truncates at 72 bytes — a silent footgun), no complexity, no breach-list check.
- **Note:** Tighten to a sensible minimum (≥8 or ≥10), add `@Size(max = 72)` or hash the password to a fixed length first, and consider a HIBP/zxcvbn check.

#### [MEDIUM] No default workspace creation on register
- `WorkspaceRepo` is imported but commented out. The TempAuthService draft showed the intended "create default workspace at signup" step. Currently, a new user has no usable workspace.
- **Note:** Restore the default-workspace creation inside the `@Transactional` register method so the user → workspace invariant is atomic.

#### [LOW] Email verification is modeled but unused
- `User.isEmailVerified` exists, but the register flow never sets a verification token, sends a verification email, or guards `login` on `isEmailVerified`.
- **Note:** Either implement an email-verification flow (token table, mail service, `/auth/verify` endpoint) or remove the column until you do.

### 4.3 Login Flow

#### [HIGH] Username-based login is broken via `loadUserByUsername`
- `CustomUserDetailsServiceImpl.loadUserByUsername()` only calls `findByEmail()`. But `LoginRequestDto.emailOrUsername` accepts either, and the controller passes the raw value into `AuthenticationManager`. If the user logs in with their username, the lookup fails with `UsernameNotFoundException`, which Spring converts to `BadCredentialsException`.
- **Note:** Change the lookup to `userRepository.findByEmailOrUsername(identifier)` so the auth manager can resolve either form.

#### [HIGH] Login does not check `isActive` before issuing tokens
- `User.isAccountNonLocked()` and `isEnabled()` both return `isActive`, so disabled users *should* be rejected by `DaoAuthenticationProvider`. **However**, `DaoAuthenticationProvider` only checks these flags when a `pre/postAuthenticationChecks` runs and `loadUserByUsername` succeeds — a subtle dependency.
- **Note:** Either explicitly assert `user.isActive()` after authentication and before issuing a token, or rely solely on `DaoAuthenticationProvider`'s built-in checks (and add an integration test).

#### [MEDIUM] `findByEmailOrUsername` is called twice per login (one implicit, one explicit)
- The auth manager already loaded the user via `loadUserByUsername` (which only checks email). After authenticating, the service calls `findByEmailOrUsername` again to issue tokens — two DB hits for one login.
- **Note:** After authentication, pull the principal out of the `Authentication` returned by `authenticationManager.authenticate(...)` instead of re-querying the DB.

#### [MEDIUM] No brute-force / rate-limit protection on login
- Unlimited `BadCredentialsException` throws cost only a BCrypt(12) verify (~250–500 ms each — actually a partial mitigation, but still allows distributed attacks).
- **Note:** Add a per-IP and per-account rate limiter (Bucket4j, Resilience4j, or Spring Security 6 `LoginAttemptService`). Lock accounts after N failures and surface via `LockedException`.

#### [LOW] `log.info` on successful login leaks email
- `log.info("[AUTH] Login: id={} email={}", user.getId(), user.getEmail());` writes PII to logs. Logs often ship to third-party SaaS observability.
- **Note:** Log only the user ID, or hash the email. Same applies to register if added later.

### 4.4 JWT Generation & Validation (`JwtUtil`)

#### [HIGH] No `jti`, `iss`, `aud` claims; no token revocation
- Tokens cannot be revoked (no blacklist / Redis). A leaked access or refresh token is valid until expiry. The 7-day refresh-token window is a long blast radius.
- **Note:** Add a `jti` claim, store revoked `jti`s in Redis with TTL = remaining-expiry, and check the blacklist in `JwtAuthenticationFilter`. The commented-out `TempAuthService` already sketches this — restore that design.

#### [HIGH] No `/auth/refresh` endpoint exists
- `RefreshRequestDto` exists, refresh tokens are issued, but there is no controller method or service method to consume them. Clients have no legitimate way to use the refresh token.
- **Note:** Implement `POST /auth/refresh` with token rotation (issue new refresh, invalidate old). Detect reuse (an old refresh presented twice → terminate all sessions).

#### [MEDIUM] No `/auth/logout` endpoint
- Without server-side state, logout is a client-only concern today. Combined with the missing revocation list, a stolen token cannot be invalidated.
- **Note:** Add `POST /auth/logout` that blacklists the access-token `jti` and deletes the refresh token from Redis.

#### [MEDIUM] `extractClaim` calls `.toString()` and crashes on missing claims
- `parseToken(token).getBody().get(claimKey).toString()` throws `NullPointerException` if the claim is absent (e.g., calling `extractEmail()` on a refresh token).
- **Note:** Safely fetch with `Optional.ofNullable(claims.get(key)).map(Object::toString).orElse(null)`. Also prefer `claims.get(key, String.class)` from JJWT.

#### [MEDIUM] Using deprecated JJWT 0.11 API
- `Jwts.parserBuilder()`, `setSigningKey`, `parseClaimsJws`, `addClaims`, `setSubject`, `setExpiration` are all deprecated in JJWT 0.12+.
- **Note:** Migrate to the new builder API: `Jwts.parser().verifyWith(key).build().parseSignedClaims(...)` and `Jwts.builder().subject(...).expiration(...).signWith(key, Jwts.SIG.HS256)`.

#### [MEDIUM] No clock-skew tolerance
- A small drift between the issuer and validator clocks will cause spurious "token expired" errors.
- **Note:** Configure `setAllowedClockSkewSeconds(30)` on the parser.

#### [LOW] `JwtUtil` annotated with both `@Component` and (unused) `@Service` import
- `import org.springframework.stereotype.Service;` is dead.
- **Note:** Delete the unused import.

#### [LOW] HS256 + symmetric key
- Acceptable for a single backend, but if multiple services need to verify tokens, asymmetric (RS256/EdDSA) is safer.
- **Note:** If/when you add a second service that validates tokens, switch to RS256 and rotate keys via JWK.

### 4.5 `JwtAuthenticationFilter`

#### [HIGH] Filter swallows all exceptions silently
- `catch (Exception e) { log.error(...); SecurityContextHolder.clearContext(); }` — a malformed token, expired token, or DB error all result in an **anonymous** request continuing down the chain. The user sees a generic 401 from `authenticationEntryPoint`, which is fine, but the broad `catch (Exception)` also masks programmer errors (e.g. `UUID.fromString` on a bad subject).
- **Note:** Catch only `JwtException`, `IllegalArgumentException`, and `UsernameNotFoundException`. Let unexpected runtime exceptions propagate so they surface in error monitoring.

#### [HIGH] `isTokenValid()` does **not** check token type
- The filter calls only `jwtUtil.isTokenValid(token)`. A **refresh token** sent in the `Authorization` header will be accepted as an access token, since both are signed with the same key. This widens the attack surface — refresh tokens are typically held longer and exposed in different storage.
- **Note:** Filter should additionally call `jwtUtil.isAccessToken(token)` and reject refresh tokens with 401.

#### [MEDIUM] Filter loads `UserDetails` from DB on **every** authenticated request
- `userDetailsService.loadUserById(...)` is called for every API call. For a high-traffic endpoint that's a query-per-request that the JWT was supposed to avoid.
- **Note:** Either build the `Authentication` directly from the JWT claims (id + role) without hitting the DB, or add a short-lived cache (Caffeine, 30–60 s TTL) keyed by user ID.

#### [LOW] `shouldNotFilter` duplicates the permit-list from `SecurityConfig`
- The skip rules in `JwtAuthenticationFilter.shouldNotFilter()` and `SecurityConfig.authorizeHttpRequests()` are maintained separately; drift will silently break things.
- **Note:** Centralize the public-path list (e.g., a `PublicEndpoints` constant array) and reference it in both places.

#### [LOW] `extractTokenFromRequest` only inspects `Authorization`
- For some flows (file downloads, SSE, websocket handshake) clients send tokens in cookies or query params.
- **Note:** Optional; if/when needed, support `?access_token=...` or an HTTP-only cookie. Requires re-enabling CSRF protection for the cookie path.

### 4.6 `SecurityConfig`

#### [MEDIUM] `/notes/**` is restricted to `hasRole("USER")` while `/admin/**` requires `hasRole("ADMIN")`
- This means an admin **cannot access notes endpoints**, since `hasRole("USER")` requires the literal role and admins only have `ROLE_ADMIN`.
- **Note:** Use `hasAnyRole("USER","ADMIN")` for `/notes/**`, or rethink the role hierarchy with `RoleHierarchyImpl` (`ROLE_ADMIN > ROLE_USER`).

#### [MEDIUM] OAuth2 endpoints are permit-listed but no OAuth2 login is configured
- `/oauth2/**` and `/login/oauth2/**` are public, and `User.OAuthProvider` enum exists, but the `oauth2Login(...)` block is commented out.
- **Note:** Either remove the dead permit-list entries until the feature lands, or wire up `OAuth2LoginConfigurer` (and the missing `OAuth2SuccessHandler`).

#### [LOW] CORS `Authorization` header is allowed and exposed — verify intent
- `setAllowedHeaders` includes `Authorization` (good for incoming) and `setExposedHeaders(List.of("Authorization"))` (rarely needed unless you echo tokens back via headers — you don't).
- **Note:** Drop the `exposedHeaders` for `Authorization` unless a real client depends on it.

#### [NIT] `authenticationEntryPoint` and `accessDeniedHandler` write JSON manually
- Building JSON via string concatenation is fragile. The shape doesn't match `ApiResponse` returned elsewhere, so clients see two different error envelopes.
- **Note:** Use `ObjectMapper` + the project's `ApiResponse` builder for consistency.

### 4.7 `ApplicationConfig`

#### [LOW] `DaoAuthenticationProvider` is declared as a `@Bean` but is **never wired** anywhere
- Spring Security 6 will auto-detect the bean, but `setUserDetailsPasswordService` is commented out and there's no test confirming the provider is in use.
- **Note:** Verify the provider is picked up (debug log or integration test). If the auto-pickup fails silently you'd fall back to the default in-memory user.

### 4.8 DTOs / Mapping

#### [LOW] `RegisterRequestDto` uses `@Data`; `LoginRequestDto` uses `@Getter/@Setter`
- Inconsistent boilerplate style across DTOs.
- **Note:** Pick one style (recommend `@Data` for DTOs) and apply it across the package.

#### [LOW] `UserResponseDto.isEmailVerified` will serialize as `emailVerified` in JSON
- Jackson strips the `is` prefix on boolean getters by default. The JSON key won't match the Java field name. May confuse front-end developers reading the spec.
- **Note:** Add `@JsonProperty("is_email_verified")` (or pick snake_case consistently across all DTOs).

#### [NIT] `RegisterRequestDto` mixes camelCase and snake_case JSON
- `username`, `email`, `password` are camelCase; `display_name`, `avatar_url` are explicitly snake-cased via `@JsonProperty`.
- **Note:** Either configure a global `PropertyNamingStrategy.SNAKE_CASE` or remove the per-field overrides. Pick one convention.

### 4.9 Repository

#### [NIT] Stray import `javax.swing.text.html.Option` in `UserRepo`
- An auto-import gone wrong; not used.
- **Note:** Delete the import.

#### [NIT] `findUserById(UUID)` duplicates `findById(UUID)` from `JpaRepository`
- Same behavior, different name.
- **Note:** Remove `findUserById`; use the inherited method.

### 4.10 Exception Handling

#### [LOW] `GlobalExceptionHandler.handleNotlyException` returns the raw exception message to the client
- For most cases (`EmailAlreadyExistsException`) this is fine — but if `NotlyException` is ever thrown with a sensitive internal detail, it's leaked verbatim.
- **Note:** Add a `clientMessage` field on `NotlyException` distinct from the log message, and only return the client-safe one.

#### [NIT] Comments mix Sinhala and English
- `// 1. අප නිර්මාණය කළ Custom Exception හැසිරවීම` — fine for personal projects, but harder for collaborators / submission reviewers.
- **Note:** Pick one language for code comments. (Same applies to a few comments in `JwtUtil`, `CustomUserDetailsServiceImpl`.)

### 4.11 Entity

#### [LOW] `User` implements `UserDetails` directly
- Couples the JPA entity to Spring Security. If `User` is later serialized over the wire (it shouldn't be, but accidents happen), Spring Security collections leak.
- **Note:** Optional — wrap in a separate `UserPrincipal` adapter. Low priority for this scope.

#### [NIT] Lots of commented-out `@OneToMany` relations
- Dead code. Either restore them when needed or delete now to keep the entity clean.

### 4.12 Repo / Service Cleanup

#### [NIT] `TempAuthService.java` is 100% commented
- Hundreds of lines of dead, package-mismatched scaffold (`com.notes...` not `lk.hemal.notly...`).
- **Note:** Delete the file. Use git history to recover if you ever want it back.

#### [NIT] Unused import `WorkspaceRepo` in `AuthServiceImpl`
- Imported but the field is commented out.
- **Note:** Remove the import (and the commented field) until default-workspace creation is implemented.

---

## 5. Missing Capabilities (not yet implemented)

These features are absent from the current flow and worth planning for:

| # | Feature | Notes |
|---|---------|-------|
| 1 | Refresh-token endpoint | Refresh tokens are issued but not consumable |
| 2 | Logout endpoint | No way to invalidate a token server-side |
| 3 | Token revocation list / Redis blacklist | Required for real logout / leak handling |
| 4 | Email verification | Field exists, flow does not |
| 5 | Password reset (forgot-password) | Not present |
| 6 | OAuth2 social login | Enum + paths exist; configuration commented out |
| 7 | Brute-force / rate limit | None |
| 8 | Audit logging (auth events) | Only `log.info`; no `ActivityLog` rows for login/logout |
| 9 | Account lockout after N failed attempts | `AccountLocked` exception exists but is never thrown |
| 10 | Multi-factor authentication | Not present |
| 11 | Default workspace creation on register | Sketch exists; not wired |
| 12 | Refresh-token rotation + reuse detection | Not present |

---

## 6. Recommended Priority Order

If/when the issues above are addressed, suggested ordering:

1. **CRITICAL:** Move `application.yml` secrets to env vars; rotate JWT secret and DB password.
2. **HIGH:** Fix `displayName` inversion bug. Add `@Valid` on controllers.
3. **HIGH:** Fix `loadUserByUsername` so username-based login works.
4. **HIGH:** Add token-type check (`isAccessToken`) in `JwtAuthenticationFilter`.
5. **HIGH:** Implement `/auth/refresh` and `/auth/logout` with Redis blacklist + rotation.
6. **MEDIUM:** Email/username normalization, password policy tightening, JJWT 0.12 migration, role-hierarchy fix for `/notes/**`.
7. **MEDIUM:** Rate limiting, audit logging, brute-force lockout.
8. **LOW / NIT:** Cleanup (dead imports, commented files, comment language, naming consistency).

---

## 7. Test Coverage Note

No tests for the auth flow exist beyond `NotlyServerApplicationTests`. Before refactoring, add:

- Unit tests for `JwtUtil` (issue, parse, expiry, type check, tampered signature)
- Slice test for `AuthController` with `@WebMvcTest` (validation errors, happy path, conflict)
- Integration test (`@SpringBootTest`) for register → login → authenticated request → 401 on expired token
- Test that disabled (`isActive=false`) users cannot log in
- Test that admin users can hit `/notes/**` (currently they can't — see §4.6)

---

## 8. Summary

The auth flow follows a recognizable Spring Security + JWT pattern and gets the basics right (BCrypt strength, stateless sessions, role-based permits, `OncePerRequestFilter`). However, several **functional bugs** (displayName inversion, broken username login, missing `@Valid`, refresh tokens accepted as access tokens, `/notes/**` blocking admins), **security gaps** (committed secrets, weak JWT secret, no revocation, no rate limit, refresh endpoint absent), and **incomplete features** (email verification, default workspace, OAuth2) need follow-up before this is production-ready.

Strongest single recommendation: **rotate the committed secrets and add the `/auth/refresh` + `/auth/logout` + token blacklist** trio. Those three together close the largest blast radius in the current design.
