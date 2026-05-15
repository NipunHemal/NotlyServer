# Google Authentication API Guide

> Full backend-handled Google OAuth2 flow. The frontend only needs to obtain the Google authorization code and send it to the backend.

---

## Overview

The Google OAuth2 flow is **fully handled in the backend**. The frontend's only responsibility is:

1. Redirect the user to Google's OAuth consent screen (or open a popup)
2. Receive the authorization code from Google after user consent
3. Send the authorization code to the backend
4. Store the returned JWT tokens (same as regular login)

```
┌──────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Google OAuth      │────▶│   Backend   │
│              │     │   (User Consent)    │     │   Notly     │
│              │◀────│   (Auth Code)       │◀────│   Server    │
└──────────────┘     └─────────────────────┘     └─────────────┘
      │                                                   │
      │  4. Receive JWT tokens                            │  3. Exchange code
      │     (access + refresh)                            │     for user info
      ▼                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        JWT Tokens                            │
│   Access Token (15 min)  +  Refresh Token (7 days)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Generate Google OAuth URL

The frontend constructs the Google OAuth URL using the client ID and redirect URI.

> **Note:** Replace `YOUR_CLIENT_ID` with your actual Google OAuth Client ID.

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `client_id` | `YOUR_CLIENT_ID.apps.googleusercontent.com` | Your Google OAuth Client ID |
| `redirect_uri` | `http://localhost:3000/auth/callback` | Your frontend callback URL |
| `response_type` | `code` | Authorization code flow |
| `scope` | `openid email profile` | Request email and profile info |
| `state` | `random-string` | CSRF protection (recommended) |

### Example URL

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID.apps.googleusercontent.com&
  redirect_uri=http://localhost:3000/auth/callback&
  response_type=code&
  scope=openid%20email%20profile&
  state=RANDOM_STATE_STRING
```

### cURL (for testing redirect)

```bash
# Open this URL in the browser
curl -I "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID.apps.googleusercontent.com&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid%20email%20profile&state=random_state_123"
```

---

## Step 2: Handle Callback and Extract Code

After the user grants permission, Google redirects back to your `redirect_uri` with the authorization code.

### Callback URL

```
http://localhost:3000/auth/callback?code=AUTH_CODE_FROM_GOOGLE&state=random_state_123
```

### Extract Parameters

| Parameter | Description |
|-----------|-------------|
| `code` | **Authorization code** — send this to the backend |
| `state` | Should match the state you sent — verify for CSRF protection |
| `error` | If user denied: `access_denied` |

---

## Step 3: Send Auth Code to Backend

### Request

```bash
curl -X POST http://localhost:8080/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AUTH_CODE_FROM_GOOGLE",
    "redirectUri": "http://localhost:3000/auth/callback"
  }'
```

### Request Body

```json
{
  "code": "4/0AfJohX...",
  "redirectUri": "http://localhost:3000/auth/callback"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | **Yes** | Google authorization code from callback |
| `redirectUri` | string | No | Must match the redirect URI used with Google. Defaults to backend config if omitted. |

---

## Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john.doe@gmail.com",
    "avatarUrl": "https://lh3.googleusercontent.com/a/...",
    "displayName": "John Doe",
    "emailVerified": true,
    "role": "USER",
    "createdAt": "2024-01-21T10:30:00",
    "updatedAt": "2024-01-21T10:30:00"
  }
}
```

**Response is identical to regular login/register.** Store the tokens and user object the same way.

---

## Error Responses

### 400 Bad Request — Invalid Code

```json
{
  "code": "INVALID_CREDENTIALS",
  "status": 400,
  "message": "Failed to authenticate with Google",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

**Cause:** The authorization code is expired, invalid, or was already used.

**Fix:** Redirect user to Google auth again to get a fresh code.

---

### 401 Unauthorized — Failed to Fetch User Info

```json
{
  "code": "INVALID_CREDENTIALS",
  "status": 401,
  "message": "Failed to get user information from Google",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

**Cause:** Backend failed to fetch user info from Google (token exchange succeeded but user info call failed).

---

### 409 Conflict — Email Already Registered

```json
{
  "code": "EMAIL_ALREADY_EXISTS",
  "status": 409,
  "message": "Email 'john.doe@gmail.com' is already registered. Please login with your password.",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

**Cause:** The Google email is already registered with a password-based account.

**Fix:** Show user a message: "This email is already registered. Please login with your password or link your account."

---

## Endpoint Summary

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Redirect to Google OAuth | `https://accounts.google.com/o/oauth2/v2/auth?...` |
| 2 | Handle callback | Your frontend route (e.g., `/auth/callback`) |
| 3 | Send code to backend | `POST /api/v1/auth/google` |

---

## Frontend Implementation Pattern

### 1. Generate Google Auth URL

```typescript
function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    redirect_uri: 'http://localhost:3000/auth/callback',
    response_type: 'code',
    scope: 'openid email profile',
    state: generateRandomState(), // e.g., crypto.randomUUID()
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

### 2. Initiate Login

```typescript
function loginWithGoogle() {
  // Option A: Full page redirect
  window.location.href = getGoogleAuthUrl();

  // Option B: Popup window
  const popup = window.open(
    getGoogleAuthUrl(),
    'google-oauth',
    'width=500,height=600'
  );
}
```

### 3. Handle Callback and Extract Code

```typescript
// In your callback route/component (e.g., /auth/callback)
function handleGoogleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    // User denied or error occurred
    console.error('Google auth error:', error);
    return { success: false, error };
  }

  if (!code) {
    return { success: false, error: 'No authorization code received' };
  }

  // Verify state matches (CSRF protection)
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    return { success: false, error: 'Invalid state parameter' };
  }

  return { success: true, code };
}
```

### 4. Send Code to Backend

```typescript
async function exchangeGoogleCode(code: string) {
  const response = await fetch('http://localhost:8080/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      redirectUri: 'http://localhost:3000/auth/callback',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Google authentication failed');
  }

  const data = await response.json();

  // Store tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data; // { accessToken, refreshToken, user }
}
```

### 5. Complete Flow Example

```typescript
async function handleGoogleLogin() {
  try {
    // Step 1: Generate and save state
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);

    // Step 2: Redirect to Google
    window.location.href = getGoogleAuthUrl(state);
  } catch (error) {
    console.error('Failed to initiate Google login:', error);
  }
}

// Called on the callback page
async function onAuthCallback() {
  const result = handleGoogleCallback();

  if (!result.success) {
    // Show error to user
    alert('Google login failed: ' + result.error);
    window.location.href = '/login';
    return;
  }

  try {
    // Step 3: Exchange code for tokens
    const authData = await exchangeGoogleCode(result.code);

    // Step 4: Redirect to app
    window.location.href = '/dashboard';
  } catch (error) {
    if (error.message.includes('already registered')) {
      alert('This email is already registered. Please login with your password.');
      window.location.href = '/login';
    } else {
      alert('Authentication failed. Please try again.');
    }
  }
}
```

---

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Application type: **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
8. Click **Create** and copy the **Client ID** and **Client Secret**

### Update Backend Config

Add the credentials to `application.yml`:

```yaml
google:
  oauth:
    client-id: "YOUR_CLIENT_ID.apps.googleusercontent.com"
    client-secret: "YOUR_CLIENT_SECRET"
    redirect-uri: "http://localhost:3000/auth/callback"
```

---

## Security Notes

- **Always verify `state` parameter** to prevent CSRF attacks
- **Authorization codes are single-use** — if the backend call fails, redirect user again
- **Codes expire quickly** (usually ~10 minutes) — exchange them immediately
- **Never expose `client_secret` in frontend** — it stays only in backend config
- **Use HTTPS in production** for both frontend and redirect URI