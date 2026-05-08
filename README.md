# NotlyServer

A RESTful API backend for **Notly** — a collaborative note-taking application built with Spring Boot.

## Project Overview

NotlyServer is a Spring Boot 4 backend that provides APIs for managing notes with collaboration features. It supports user authentication (JWT), workspaces, groups, notes, tags, reminders, media attachments, and friend management.

### Key Features

- **Authentication** — JWT-based login, registration, and token refresh
- **Notes** — Create, update, delete, and share notes with collaborators
- **Workspaces** — Organize notes into personal or shared workspaces
- **Groups** — Group-based note management
- **Collaborators** — Share notes with other users and manage permissions
- **Friends** — Send, accept, and manage friend connections
- **Reminders** — Set reminders on notes
- **Media** — Attach media files to notes
- **Activity Log** — Track user activity across the platform
- **Bin** — Soft-delete with recycle bin recovery
- **Public Notes** — Notes with public visibility are accessible without auth

### Tech Stack

| Technology        | Version  |
|-------------------|----------|
| Java             | 21       |
| Spring Boot      | 4.0.4    |
| Spring Security   | JWT auth |
| Spring Data JPA  | Hibernate |
| PostgreSQL        | Runtime  |
| MapStruct        | 1.6.0    |
| Lombok           | 1.18.30  |
| Maven             | Wrapper  |

### API Base Path

All API endpoints are prefixed with:

```
/api/v1
```

### Project Structure

```
src/main/java/lk/hemal/notly/
├── config/            # Security, CORS, and API configuration
├── controller/        # REST controllers
├── core/enums/        # Enumerations (PriorityLevel, Visibility, etc.)
├── dto/               # Request/Response DTOs
├── entity/            # JPA entities
├── exception/         # Custom exceptions & global handler
├── mapper/            # MapStruct mappers
├── repo/              # Spring Data JPA repositories
├── security/          # JWT authentication filter
├── service/           # Business logic (interfaces & implementations)
└── util/              # Utility classes (JWT util)
```

---

## How to Run

### Prerequisites

- **Java 21** (or higher)
- **Maven 3.9+** (or use the included Maven wrapper)
- **PostgreSQL** database running and accessible

### 1. Configure Database

Edit `src/main/resources/application.yml` and update the datasource settings:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://<HOST>:<PORT>/<DB_NAME>
    username: <YOUR_USERNAME>
    password: <YOUR_PASSWORD>
```

### 2. Run the Application

Using Maven wrapper:

```bash
./mvnw spring-boot:run
```

On Windows:

```cmd
mvnw.cmd spring-boot:run
```

Or build and run the JAR:

```bash
./mvnw clean package
java -jar target/Notly-0.0.1-SNAPSHOT.jar
```

The server starts on **port 8080** by default.

### 3. Verify

```bash
curl http://localhost:8080/test
```

---

## Viewing Swagger / API Documentation

The project's security configuration allows public access to Swagger UI and OpenAPI docs endpoints. However, the **springdoc-openapi dependency is not yet added** to the project.

### Step 1 — Add the Dependency

Add the following to `pom.xml` inside `<dependencies>`:

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.8</version>
</dependency>
```

### Step 2 — Restart the Application

```bash
./mvnw spring-boot:run
```

### Step 3 — Access Swagger UI

Open your browser and navigate to:

```
http://localhost:8080/swagger-ui.html
```

Or the alternative path:

```
http://localhost:8080/swagger-ui/index.html
```

### Step 4 — Access Raw OpenAPI JSON

The OpenAPI specification in JSON format is available at:

```
http://localhost:8080/v3/api-docs
```

> Both `/swagger-ui/**` and `/v3/api-docs/**` are configured as public endpoints in `SecurityConfig.java` — no authentication required.