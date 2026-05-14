

# Notly Exception Handling Guidelines

This document describes the centralized exception handling architecture for the **Notly Server** project. All developers must follow these conventions to ensure consistent, observable, and frontend-friendly error responses.

---

## 1. Philosophy

- **One exception to rule them all:** `NotlyException` is the only custom runtime exception you should throw in business code.
- **Error codes over classes:** Instead of creating a new exception class for every error scenario, use the `ErrorCode` enum.
- **Observability first:** Every unexpected error generates a `traceId` (UUID) so operators can correlate logs with user reports.
- **RFC 7807 inspired:** Error responses are structured, predictable, and easy to consume by API clients.

---

## 2. Architecture Overview

| Component | Responsibility |
|-----------|----------------|
| `ErrorCode` | Centralized enum of every error type. Defines `code`, `HttpStatus`, and `defaultMessage`. |
| `NotlyException` | The single domain exception. Carries an `ErrorCode` and an optional custom message. |
| `ErrorResponse` | The JSON payload returned to clients. Contains `code`, `status`, `message`, `timestamp`, `traceId`, and optional `fieldErrors`. |
| `GlobalExceptionHandler` | `@RestControllerAdvice` that translates exceptions into `ErrorResponse` automatically. |

---

## 3. ErrorCode Convention

### Existing Categories

- `VAL_001`  — Validation / Bad Request
- `REQ_001`  — General Bad Request
- `AUTH_001` … `AUTH_005` — Authentication & Authorization
- `RES_001` … `RES_006` — Resource errors (not found, conflict, duplicate)
- `INT_001`  — Internal Server Error (fallback)

### Adding a New Error Code

1. Open `ErrorCode.java`.
2. Add a new enum constant following the naming pattern: `SCREAMING_SNAKE_CASE("PREFIX_###", HttpStatus.XXX, "Default message")`.
3. Use a descriptive code prefix that matches the domain (e.g., `AUTH_`, `RES_`, `WS_` for workspace).
4. Never reuse an existing numeric suffix within the same prefix.

Example:

```java
WORKSPACE_NOT_FOUND("WS_001", HttpStatus.NOT_FOUND, "Workspace not found")
```

---

## 4. Throwing Exceptions

### 4.1 Default Message

Use this when the default message in `ErrorCode` is sufficient.

```java
throw new NotlyException(ErrorCode.INVALID_CREDENTIALS);
```

### 4.2 Custom Message

Use this when you need to include dynamic context (IDs, names, etc.).

```java
throw new NotlyException(ErrorCode.USERNAME_ALREADY_EXISTS,
        "Username '" + username + "' is already taken");
```

### 4.3 With Cause

Use this when wrapping a lower-level exception that should be preserved for stack traces.

```java
throw new NotlyException(ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to process payment", originalException);
```

---

## 5. What the Handler Does Automatically

You **do not** need to write try/catch blocks in controllers. The `GlobalExceptionHandler` handles the following:

### 5.1 NotlyException

Returns the `ErrorCode`'s HTTP status and builds an `ErrorResponse`.

### 5.2 MethodArgumentNotValidException

Triggered by `@Valid` failures. The handler collects all field errors into a `Map<String, String>` and returns:

```json
{
  "code": "VAL_001",
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-05-11T08:00:00Z",
  "fieldErrors": {
    "email": "must be a well-formed email address",
    "password": "size must be between 8 and 64"
  }
}
```

### 5.3 Generic Exception (Fallback)

Any unhandled exception becomes a `500 Internal Server Error` with a generated UUID `traceId`:

```json
{
  "code": "INT_001",
  "status": 500,
  "message": "An unexpected error occurred",
  "timestamp": "2026-05-11T08:00:00Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Important:** When a user reports a `500` error, ask for the `traceId` and search the server logs for that UUID.

---

## 6. Common Usage Examples

### Resource Not Found

```java
User user = userRepo.findById(id)
        .orElseThrow(() -> new NotlyException(ErrorCode.RESOURCE_NOT_FOUND,
                "User with id " + id + " not found"));
```

### Conflict / Duplicate

```java
if (workspaceRepo.existsByName(name)) {
    throw new NotlyException(ErrorCode.CONFLICT,
            "Workspace name '" + name + "' already exists");
}
```

### Forbidden

```java
if (!currentUser.isAdmin()) {
    throw new NotlyException(ErrorCode.FORBIDDEN,
            "Admin access required");
}
```

### Validation in Service Layer

```java
if (dto.getDeadline().isBefore(LocalDateTime.now())) {
    throw new NotlyException(ErrorCode.BAD_REQUEST,
            "Deadline must be in the future");
}
```

---

## 7. Best Practices

| Do | Don't |
|---|---|
| Use `NotlyException(ErrorCode.XXX)` for all business errors. | Create new exception subclasses. |
| Provide custom messages that explain **what** went wrong and **which resource** was involved. | Return generic messages like "Error occurred" when context is available. |
| Log additional context in the service layer if needed (`log.warn`, `log.error`). | Catch and swallow exceptions silently. |
| Return `ErrorCode.INTERNAL_SERVER_ERROR` only for truly unexpected failures. | Map user input errors to `500`. |
| Use `@Valid` on controller method parameters for bean validation. | Manually validate every field in the service layer when bean validation can do it. |

---

## 8. Migration Notes

The following legacy exception classes have been removed. Update any old code that references them:

| Old Class | Replacement |
|-----------|-------------|
| `BadRequestException` | `new NotlyException(ErrorCode.BAD_REQUEST, ...)` |
| `ValidationException` | `new NotlyException(ErrorCode.VALIDATION_FAILED, ...)` |
| `UnauthorizedException` | `new NotlyException(ErrorCode.UNAUTHORIZED, ...)` |
| `InvalidCredentialsException` | `new NotlyException(ErrorCode.INVALID_CREDENTIALS)` |
| `ForbiddenException` | `new NotlyException(ErrorCode.FORBIDDEN, ...)` |
| `ResourceNotFoundException` | `new NotlyException(ErrorCode.RESOURCE_NOT_FOUND, ...)` |
| `ConflictException` | `new NotlyException(ErrorCode.CONFLICT, ...)` |
| `DuplicateResourceException` | `new NotlyException(ErrorCode.DUPLICATE_RESOURCE, ...)` |
| `ResourceAlreadyExistException` | `new NotlyException(ErrorCode.RESOURCE_ALREADY_EXISTS, ...)` |
| `AuthException.EmailAlreadyExistsException` | `new NotlyException(ErrorCode.EMAIL_ALREADY_EXISTS, ...)` |
| `AuthException.UsernameAlreadyExistsException` | `new NotlyException(ErrorCode.USERNAME_ALREADY_EXISTS, ...)` |
| `AuthException.AccountDisabledException` | `new NotlyException(ErrorCode.ACCOUNT_DISABLED)` |
| `AuthException.AccountLocked` | `new NotlyException(ErrorCode.ACCOUNT_LOCKED)` |

---

## 9. Response Field Reference

| Field | Type | Presence | Description |
|-------|------|----------|-------------|
| `code` | String | Always | Machine-readable error code (e.g., `AUTH_001`). |
| `status` | Integer | Always | HTTP status code (e.g., `401`). |
| `message` | String | Always | Human-readable error description. |
| `timestamp` | ISO-8601 | Always | UTC instant when the error occurred. |
| `traceId` | UUID | 500 errors only | Unique identifier for log correlation. |
| `fieldErrors` | Object | Validation errors only | Map of field names to error messages. |
