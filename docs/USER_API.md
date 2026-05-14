# User API Documentation

> Base URL: `http://localhost:8080/api/v1`
> Auth: Bearer JWT token in `Authorization` header

---

## 1. Get Current User Profile

Retrieve the authenticated user's profile.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "avatarUrl": "https://example.com/avatar.png",
  "displayName": "John Doe",
  "emailVerified": true,
  "role": "USER",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-20T14:22:00"
}
```

### Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized. Please login."
}
```

---

## 2. Update Profile

Update the current user's profile fields.

### Request

```bash
curl -X PUT http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe_new",
    "displayName": "Johnny Doe",
    "avatarUrl": "https://example.com/new-avatar.png"
  }'
```

### Request Body (all fields optional)

```json
{
  "username": "johndoe_new",
  "displayName": "Johnny Doe",
  "avatarUrl": "https://example.com/new-avatar.png"
}
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe_new",
  "email": "john.doe@example.com",
  "avatarUrl": "https://example.com/new-avatar.png",
  "displayName": "Johnny Doe",
  "emailVerified": true,
  "role": "USER",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-21T09:15:00"
}
```

### Response (409 Conflict - Username taken)

```json
{
  "code": "USERNAME_ALREADY_EXISTS",
  "status": 409,
  "message": "Username 'johndoe_new' is already taken",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

### Response (400 Bad Request - Validation)

```json
{
  "code": "VALIDATION_FAILED",
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-21T09:15:30Z",
  "fieldErrors": {
    "username": "Username must be between 3 and 50 characters"
  }
}
```

---

## 3. Get User by ID

Retrieve any user's public profile by UUID.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "avatarUrl": "https://example.com/avatar.png",
  "displayName": "John Doe",
  "emailVerified": true,
  "role": "USER",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-20T14:22:00"
}
```

### Response (404 Not Found)

```json
{
  "code": "INVALID_CREDENTIALS",
  "status": 401,
  "message": "User not found",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 4. Change Password

Change the current user's password.

### Request

```bash
curl -X PUT http://localhost:8080/api/v1/users/me/password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldP@ss123",
    "newPassword": "NewStr0ngP@ss"
  }'
```

### Request Body

```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewStr0ngP@ss"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null,
  "timestamp": "2024-01-21T09:15:00"
}
```

### Response (401 Unauthorized - Wrong current password)

```json
{
  "code": "INVALID_CREDENTIALS",
  "status": 401,
  "message": "Current password is incorrect",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

### Response (401 Unauthorized - OAuth user)

```json
{
  "code": "INVALID_CREDENTIALS",
  "status": 401,
  "message": "OAuth users cannot change password",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

### Response (400 Bad Request - Validation)

```json
{
  "code": "VALIDATION_FAILED",
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-21T09:15:30Z",
  "fieldErrors": {
    "newPassword": "New password must be at least 6 characters"
  }
}
```

---

## 5. Delete Account

Soft-delete the current user account.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": null,
  "timestamp": "2024-01-21T09:15:00"
}
```

### Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized. Please login."
}
```

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/me` | Bearer | Get current user profile |
| PUT | `/api/v1/users/me` | Bearer | Update profile |
| GET | `/api/v1/users/{userId}` | Bearer | Get user by ID |
| PUT | `/api/v1/users/me/password` | Bearer | Change password |
| DELETE | `/api/v1/users/me` | Bearer | Deactivate account |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation failed |
| 401 | Unauthorized / Invalid credentials |
| 403 | Access denied |
| 404 | Not found |
| 409 | Conflict (username/email exists) |
| 500 | Internal server error |