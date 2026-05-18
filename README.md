<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5.0-brightgreen?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-red?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

<h1 align="center">📝 Notly Server</h1>

<p align="center">
  <strong>A secure, feature-rich RESTful API backend for collaborative note-taking</strong><br/>
  Built with Spring Boot · Secured with JWT & OAuth2 · Powered by PostgreSQL
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Authentication](#-authentication)
- [Security Features](#-security-features)
- [Database Design](#-database-design)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Documentation (Swagger)](#-api-documentation-swagger)
- [Contributing](#-contributing)

---

## 🌟 Overview

**Notly** is a personal and collaborative note-taking platform (similar to Notion / Google Keep / Evernote). This repository (`NotlyServer`) is the **backend REST API** that powers the entire application.

Notly organizes content in a **3-level hierarchy**: `Workspace → Groups (Folders) → Notes`, with support for unlimited nesting of groups, real-time autosave with version history, password-protected vaults, public sharing, collaboration, and a 30-day recycle bin with automatic purging.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Client (Web / Mobile)                            │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ HTTPS + JWT (Bearer)
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Spring Boot Backend                                │
│                                                                          │
│  ┌────────────────┐   ┌──────────────────┐   ┌────────────────────────┐ │
│  │  Controllers   │──▶│  Services (impl) │──▶│  JPA Repositories      │ │
│  │  (REST API)    │   │  (Business Logic)│   │  (Data Access)         │ │
│  └────────────────┘   └──────────────────┘   └────────────┬───────────┘ │
│         ▲                                                  │             │
│         │                                                  ▼             │
│  ┌──────┴──────────────────────────────────┐   ┌──────────────────────┐ │
│  │  Security Filter Chain                  │   │    PostgreSQL DB     │ │
│  │  RateLimitFilter → JwtAuthFilter        │   │    (JSONB + UUID)    │ │
│  └─────────────────────────────────────────┘   └──────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                          │                    │
                          ▼                    ▼
                 Google OAuth2 API      Gmail SMTP (Notifications)
```

**Design Pattern:** Layered N-tier Architecture — Controller → Service → Repository → Database

---

## ✨ Features

### Core Note Management
| Feature | Description |
|---------|-------------|
| 📝 **Notes CRUD** | Create, read, update, delete notes with rich JSON content (Tiptap/ProseMirror) |
| 💾 **Autosave** | Debounced autosave with SHA-256 content hash deduplication (zero writes if unchanged) |
| 📜 **Version History** | Immutable snapshots on every meaningful change; restore any previous version |
| 📂 **Nested Groups** | Unlimited folder nesting with drag-and-drop reordering |
| 🏢 **Workspaces** | Top-level organizational containers auto-provisioned on registration |

### Organization & Navigation
| Feature | Description |
|---------|-------------|
| 🌳 **Group Tree** | Full recursive tree view built in-memory for fast sidebar rendering |
| 🧭 **Breadcrumbs** | Navigate the full path from root to any group |
| ⭐ **Favorites** | Quick-access favorites for notes and groups |
| 📦 **Archive** | Non-destructive long-term storage (no expiry, fully searchable) |
| 🔄 **Move / Copy / Duplicate** | Rearrange notes across groups with circular-reference prevention |

### Security & Privacy
| Feature | Description |
|---------|-------------|
| 🔐 **Lock / Unlock** | Password-protect individual notes or entire groups (BCrypt hashed) |
| 🏦 **Secure Vault** | Password-gated folders — all contents hidden until unlocked |
| 🎫 **Unlock Tokens** | Short-lived JWT (2h) scoped to specific entities via `X-Unlock-Token` header |
| 🛡️ **Brute-Force Protection** | 5 failed attempts → 60-second cooldown per entity per user |
| ⏱️ **Rate Limiting** | Tiered token-bucket algorithm (Bucket4j) with per-user/per-IP buckets |

### Collaboration & Sharing
| Feature | Description |
|---------|-------------|
| 🌐 **Public Links** | Share notes/groups via unique token — no login required for viewers |
| 👥 **Collaborators** | Invite users by email with role-based access (Editor / Viewer) |
| 🔗 **Link Management** | Generate, regenerate, or revoke public share links |

### Infrastructure
| Feature | Description |
|---------|-------------|
| 🗑️ **Recycle Bin** | 30-day soft-delete with restore capability |
| ⏰ **Auto-Purge** | Scheduled cron job (daily 03:00) permanently deletes expired bin items |
| 📊 **Dashboard** | Aggregated stats and recent activity feed |
| 📋 **Activity Log** | Full audit trail of all user actions with filtering and date ranges |
| 📧 **Email Notifications** | Transactional emails for sharing, security events, and reminders |
| 📖 **Swagger/OpenAPI** | Auto-generated interactive API documentation |

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Java** | 21 (LTS) | Language runtime — records, sealed classes, virtual threads |
| **Spring Boot** | 3.5.0 | Application framework with auto-configuration |
| **Spring Security** | 6.x | Authentication & authorization filter chain |
| **Spring Data JPA** | Hibernate 6 | ORM with soft-delete, optimistic locking, JSONB support |
| **PostgreSQL** | 16+ | ACID-compliant relational DB with JSONB and full-text search |
| **JWT (jjwt)** | 0.11.5 | Stateless authentication (Access + Refresh + Unlock tokens) |
| **OAuth2 Client** | Spring | Google social login integration |
| **MapStruct** | 1.6.0 | Compile-time type-safe DTO ↔ Entity mapping |
| **Lombok** | 1.18.30 | Boilerplate reduction |
| **Bucket4j** | 8.10.1 | Token-bucket rate limiting |
| **Springdoc OpenAPI** | 2.7.0 | Swagger UI auto-generation |
| **Spring Mail** | — | Gmail SMTP transactional emails |
| **Maven** | Wrapper | Build & dependency management |

---

## 🚀 Getting Started

### Prerequisites

- **Java 21** or higher
- **Maven 3.9+** (or use the included Maven wrapper)
- **PostgreSQL** database instance

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/NotlyServer.git
cd NotlyServer
```

### 2. Configure the Database

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/notly_db
    username: your_username
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update    # Auto-migrates schema
```

### 3. Configure JWT Secret

```yaml
jwt:
  secret: "your-base64-encoded-secret-key-minimum-256-bits"
  access-token-expiry: 900000       # 15 minutes
  refresh-token-expiry: 604800000   # 7 days
  unlock-token-expiry: 7200000      # 2 hours
```

### 4. Configure Google OAuth2 (Optional)

```yaml
google:
  oauth:
    client-id: "YOUR_CLIENT_ID.apps.googleusercontent.com"
    client-secret: "YOUR_CLIENT_SECRET"
    redirect-uri: "http://localhost:3000/auth/callback"
```

### 5. Configure Email (Optional)

```yaml
email:
  enabled: true          # Set false for local dev (uses NoOp logger)
  provider: google
  from: "your-app@gmail.com"
  smtp:
    host: smtp.gmail.com
    port: 587
    username: YOUR_GMAIL
    password: YOUR_APP_PASSWORD
```

### 6. Run the Application

**Using Maven Wrapper:**

```bash
# Linux / macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

**Or build and run the JAR:**

```bash
./mvnw clean package -DskipTests
java -jar target/notly-0.0.1-SNAPSHOT.jar
```

### 7. Verify

```bash
curl http://localhost:8080/test
# Expected: Server is running
```

The server starts on **port 8080** by default.

---

## 📡 API Reference

**Base URL:** `http://localhost:8080/api/v1`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login with email/username + password |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | Bearer | Invalidate refresh token |
| POST | `/auth/google` | — | Google OAuth2 login |

### Notes (22 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notes` | Create note |
| GET | `/notes/{id}` | Get note (supports `X-Unlock-Token`) |
| GET | `/notes` | List notes (filter: `group_id`, `status`, `favorite`) |
| PATCH | `/notes/{id}` | Update note (partial) |
| PATCH | `/notes/{id}/autosave` | Autosave with hash deduplication |
| GET | `/notes/{id}/versions` | Get version history (paginated) |
| POST | `/notes/{id}/versions/{vId}/restore` | Restore to previous version |
| POST | `/notes/{id}/move` | Move to different group |
| POST | `/notes/{id}/duplicate` | Duplicate in same group |
| POST | `/notes/{id}/copy` | Copy to different group |
| POST | `/notes/{id}/archive` | Archive note |
| POST | `/notes/{id}/unarchive` | Unarchive note |
| DELETE | `/notes/{id}` | Soft delete → Bin |
| POST | `/notes/{id}/lock` | Lock with password |
| POST | `/notes/{id}/unlock` | Unlock → get token |
| PUT | `/notes/{id}/lock` | Change lock password |
| DELETE | `/notes/{id}/lock` | Remove lock |
| POST | `/notes/{id}/public-link` | Create public link |
| POST | `/notes/{id}/public-link/regenerate` | Regenerate link |
| DELETE | `/notes/{id}/public-link` | Revoke link |
| POST | `/notes/{id}/favorite` | Toggle favorite |
| GET | `/notes/public/{token}` | Read public note (no auth) |

### Groups (22 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/groups` | Create group (supports secure vault) |
| GET | `/groups/{id}` | Get group metadata |
| GET | `/groups/{id}/children` | Get children (groups + notes) |
| GET | `/groups/tree` | Get full nested tree |
| GET | `/groups/{id}/breadcrumb` | Get breadcrumb path |
| PATCH | `/groups/{id}` | Rename group |
| GET | `/groups/{id}/stats` | Get statistics |
| POST | `/groups/{id}/move` | Move group |
| POST | `/groups/{id}/reorder` | Reorder among siblings |
| POST | `/groups/{id}/duplicate` | Deep duplicate |
| POST | `/groups/{id}/archive` | Archive recursively |
| POST | `/groups/{id}/unarchive` | Unarchive recursively |
| DELETE | `/groups/{id}` | Soft delete → Bin |
| POST | `/groups/{id}/lock` | Lock with password |
| POST | `/groups/{id}/unlock` | Unlock → token |
| PUT | `/groups/{id}/lock` | Change password |
| DELETE | `/groups/{id}/lock` | Remove lock |
| POST | `/groups/{id}/public-link` | Create public link |
| POST | `/groups/{id}/public-link/regenerate` | Regenerate link |
| DELETE | `/groups/{id}/public-link` | Revoke link |
| POST | `/groups/{id}/collaborators` | Share with user |
| GET | `/groups/{id}/collaborators` | List collaborators |
| PUT | `/groups/{id}/collaborators/{userId}` | Update role |
| DELETE | `/groups/{id}/collaborators/{userId}` | Remove collaborator |
| POST | `/groups/{id}/favorite` | Toggle favorite |
| GET | `/groups/public/{token}` | Get public group (no auth) |

### Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces` | List user's workspaces |
| GET | `/workspaces/{id}` | Get workspace by ID |

### Recycle Bin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bin` | List all bin items |
| POST | `/bin/{id}/restore` | Restore item |
| DELETE | `/bin/{id}` | Permanently delete item |
| DELETE | `/bin` | Empty entire bin |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Aggregated statistics |
| GET | `/dashboard/recent` | Recent activity feed |

### Activity Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities/me` | My activities (paginated) |
| GET | `/activities/me/entity/{type}` | Filter by entity type |
| GET | `/activities/me/action/{action}` | Filter by action |
| GET | `/activities/entity/{type}/{id}` | Entity audit trail |
| GET | `/activities/me/range` | Date range filter |
| GET | `/activities/me/stats` | Activity statistics |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update profile |
| GET | `/users/{id}` | Get user by ID |
| PUT | `/users/me/password` | Change password |
| DELETE | `/users/me` | Deactivate account |

### Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/favorites` | Get all favorites (notes + groups) |

---

## 🔑 Authentication

Notly uses **stateless JWT authentication** with three token types:

```
┌─────────────────────────────────────────────────────────────┐
│                      Token Types                             │
├─────────────────┬───────────────┬───────────────────────────┤
│  Access Token   │  Refresh Token │  Unlock Token            │
│  (15 min)       │  (7 days)      │  (2 hours)              │
│  Every API call │  Get new access│  Access locked content   │
│  Bearer header  │  /auth/refresh │  X-Unlock-Token header   │
└─────────────────┴───────────────┴───────────────────────────┘
```

### Authentication Flow

```
1. Register/Login → Receive access + refresh tokens
2. Use access token in Authorization: Bearer <token>
3. When access expires → POST /auth/refresh with refresh token
4. Receive new access + refresh tokens (rotation)
5. Logout → Invalidates refresh token server-side
```

### Google OAuth2 Flow

```
Client → Google Consent Screen → Auth Code → POST /auth/google { code }
Server → Exchange code with Google → Fetch user info → Issue Notly JWTs
```

---

## 🛡 Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | BCrypt (cost factor 12) — never stored in plaintext |
| **JWT Signing** | HMAC-SHA256 with configurable secret |
| **CSRF Protection** | Disabled (stateless API, no cookie sessions) |
| **CORS** | Configurable allowed origins, methods, and headers |
| **Rate Limiting** | 4-tier token-bucket (Public: 20/min, API: 100/min, Heavy: 10/min, Sensitive: 5/min) |
| **Brute-Force Protection** | Lock attempts tracked per entity/user (5 attempts → 60s block) |
| **Soft Delete** | `@SQLDelete` + `@SQLRestriction` — deleted data invisible but recoverable |
| **Optimistic Locking** | `@Version` on notes prevents lost updates during concurrent edits |
| **Input Validation** | Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@Email`) |
| **UUID Primary Keys** | Prevents ID enumeration attacks |
| **Stateless Sessions** | `SessionCreationPolicy.STATELESS` — no server-side session storage |

### Rate Limiting Tiers

| Tier | Capacity/min | Burst | Applies To |
|------|-------------|-------|------------|
| **Public** | 20 | 30 | `/auth/**`, OAuth, public shares |
| **API** | 100 | 150 | All authenticated endpoints |
| **Heavy** | 10 | 15 | Search, export operations |
| **Sensitive** | 5 | 8 | Password change, account delete |

---

## 🗄 Database Design

```
User 1──n Workspace 1──n Group 1──n Group (self-referencing tree)
                                  └──n Note 1──n NoteVersion
                                              1──n NoteTag
                                              1──n NoteMedia
                                              1──n Reminder
                                              n──n User (via Collaborator)
                         Group n──n User (via GroupCollaborator)
User 1──n ActivityLog
User 1──n BinItem
User n──n User (via Friend)
```

### Key Design Decisions

- **UUID primary keys** — distributed-friendly, prevents enumeration
- **Soft delete** via `@SQLDelete` / `@SQLRestriction` — transparent to application code
- **JSONB content** — rich editor content stored as PostgreSQL JSONB
- **Optimistic locking** — `@Version` prevents concurrent edit conflicts
- **Content hash** — SHA-256 deduplication for autosave (zero writes if unchanged)
- **Self-referencing groups** — unlimited folder nesting via `parent_id`
- **Indexed foreign keys** — `owner_id`, `group_id`, `workspace_id`, `deleted_at`

---

## 📁 Project Structure

```
src/main/java/lk/hemal/notly/
├── NotlyServerApplication.java         # @SpringBootApplication + @EnableScheduling
├── config/                             # Configuration beans
│   ├── ApiConfig.java                  # API base path, CORS settings
│   ├── EmailConfig.java                # Email provider configuration
│   ├── GoogleOAuthConfig.java          # OAuth2 client properties
│   ├── MailSenderConfig.java           # JavaMailSender bean
│   ├── OpenApiConfig.java              # Swagger metadata
│   ├── RateLimitProperties.java        # @ConfigurationProperties for rate limits
│   └── security/
│       ├── ApplicationConfig.java      # AuthenticationManager, PasswordEncoder
│       └── SecurityConfig.java         # Filter chain, CORS, endpoint rules
├── controller/                         # REST controllers (thin, delegation only)
│   ├── AuthController.java
│   ├── NoteController.java
│   ├── GroupController.java
│   ├── WorkspaceController.java
│   ├── BinController.java
│   ├── DashboardController.java
│   ├── ActivityLogController.java
│   ├── FavoritesController.java
│   └── UserController.java
├── core/enums/                         # Shared enumerations
│   ├── ActivityType.java
│   ├── ItemStatus.java
│   ├── PermissionRole.java
│   ├── PriorityLevel.java
│   └── Visibility.java
├── dto/                                # Data Transfer Objects
│   ├── request/                        # Incoming request payloads
│   └── response/                       # Outgoing response payloads
├── entity/                             # JPA entities (DB tables)
│   ├── BaseEntity.java                 # UUID id, createdAt, updatedAt
│   ├── User.java                       # Implements UserDetails
│   ├── Workspace.java
│   ├── Group.java                      # Self-referencing tree
│   ├── Note.java                       # Soft-delete, optimistic locking
│   ├── NoteVersion.java                # Immutable snapshots
│   ├── Collaborator.java               # Note sharing
│   ├── GroupCollaborator.java          # Group sharing
│   ├── BinItem.java                    # Recycle bin records
│   ├── ActivityLog.java                # Audit trail
│   ├── Reminder.java
│   ├── NoteTag.java
│   ├── NoteMedia.java
│   └── Friend.java
├── exception/                          # Error handling
│   ├── ErrorCode.java                  # Enum: code + HTTP status + message
│   ├── NotlyException.java             # Single exception class
│   └── GlobalExceptionHandler.java     # @RestControllerAdvice
├── mapper/                             # MapStruct mappers (compile-time)
├── repo/                               # Spring Data JPA repositories
├── scheduler/                          # Scheduled tasks
│   └── BinPurgeScheduler.java          # Daily 03:00 auto-purge
├── security/                           # Security filters
│   ├── JwtAuthenticationFilter.java    # OncePerRequestFilter
│   └── RateLimitingFilter.java         # Token-bucket enforcement
├── service/                            # Business logic interfaces
│   └── impl/                           # Service implementations
└── util/                               # Utilities
    ├── JwtUtil.java                    # Token generation & validation
    └── ContentHashUtil.java            # SHA-256 content hashing
```

---

## ⚙️ Configuration

### `application.yml` Key Properties

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/notly_db
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

jwt:
  secret: ${JWT_SECRET}
  access-token-expiry: 900000
  refresh-token-expiry: 604800000
  unlock-token-expiry: 7200000

rate-limit:
  enabled: true
  refill-period: PT1M
  public-tier:  { capacity: 20, burst: 30 }
  api-tier:     { capacity: 100, burst: 150 }
  heavy-tier:   { capacity: 10, burst: 15 }
  sensitive-tier: { capacity: 5, burst: 8 }

email:
  enabled: false    # Set true for production
  provider: google

google:
  oauth:
    client-id: ${GOOGLE_CLIENT_ID}
    client-secret: ${GOOGLE_CLIENT_SECRET}
```

---

## 📖 API Documentation (Swagger)

Once the server is running, access the interactive API documentation:

| Resource | URL |
|----------|-----|
| **Swagger UI** | http://localhost:8080/swagger-ui.html |
| **OpenAPI JSON** | http://localhost:8080/v3/api-docs |

Both endpoints are publicly accessible (no authentication required).

---

## 📊 Error Handling

All errors follow a consistent JSON structure:

```json
{
  "code": "NOTE_001",
  "status": 404,
  "message": "Note not found",
  "timestamp": "2025-01-15T10:30:00Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fieldErrors": {}
}
```

### Error Code Prefixes

| Prefix | Domain |
|--------|--------|
| `AUTH_*` | Authentication & authorization |
| `NOTE_*` | Note operations |
| `GRP_*` | Group operations |
| `WS_*` | Workspace operations |
| `LOCK_*` | Lock/unlock operations |
| `SHR_*` | Sharing operations |
| `BIN_*` | Recycle bin operations |
| `VAL_*` | Validation errors |
| `RAT_*` | Rate limiting |
| `CON_*` | Concurrency conflicts |

---

## 🔄 Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| **Bin Purge** | Daily at 03:00 | Permanently deletes bin items past their 30-day restore deadline. Cascades through collaborators, reminders, tags, media, and activity logs. |

---

## 📬 Email Notifications

| Event | Email Sent |
|-------|------------|
| User Registration | Welcome email |
| Google Sign Up (new user) | Welcome email |
| Password Change | Security notification |
| Profile Update | Security notification |
| Account Deactivation | Confirmation email |
| Group Shared | Invitation to collaborator |
| Role Updated | Role change notification |
| Collaborator Removed | Access removed notification |

> Set `email.enabled: false` in development — uses a no-op logger instead of sending real emails.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed as a final-year project at **IJSE (Institute of Java & Software Engineering)**.

---

<p align="center">
  <strong>Built with ❤️ by Hemal</strong><br/>
  <em>IJSE — 2nd Semester Final Project</em>
</p>
