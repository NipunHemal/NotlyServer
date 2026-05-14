# Notly Server — Group (Folder) & Note Implementation Plan

> **Audience:** an AI coding agent (e.g. opencode) implementing the backend.
> **Goal:** implement the full **Group/folder** and **Note** flow on top of the existing Spring Boot codebase.
> **Source of truth for behaviour:** `docs/Feature_Explane.md`. This plan narrows that spec to the scope agreed with the project owner and maps it onto the *actual* code that already exists in this repo.
>
> Read sections 1–4 before writing any code. Then implement phase by phase (section 7). Do **not** invent new architecture — mirror the patterns already used by the Auth feature.

---

## 0. Scope (what to build / what NOT to build)

**IN SCOPE — Group (folder):**
1. Core CRUD + nested tree (create, rename, get, list children, recursive tree, breadcrumb).
2. Move (with circular-reference prevention) + reorder among siblings (`sortOrder`).
3. Archive / unarchive (cascades to descendant groups + notes) + soft-delete to Bin + restore + permanent delete + 30-day auto-purge scheduler.
4. Lock / unlock (BCrypt password), favorite toggle, deep-duplicate (group + all its notes).
5. **Secure Group** (vault): a group created with `isSecure = true` is password-gated; notes inside it are "secured by the group".
6. Share a group **publicly (link/token)** or **with a specific person by email** (role-based collaborator).

**IN SCOPE — Note:**
1. Core CRUD + autosave (`POST` create defaults to `"Untitled"`, `GET` one / list-by-group, `PATCH` partial update for autosave, `DELETE`).
2. Move to another group, duplicate in place, copy-to-folder (duplicate into a target group, original kept).
3. Archive / unarchive + soft-delete to Bin + restore + permanent delete (cascade delete tags / reminders / collaborators / media / activity) + 30-day auto-purge scheduler.
4. Lock / unlock (BCrypt) with a session unlock token, favorite toggle, public-link share token + public read endpoint.
5. **Secure Note**: a note inside a secure group inherits the group's gate; a note may additionally have its own password (double layer).
6. **Wrong-password cooldown / rate-limit**: after 5 failed unlock attempts on a note or group, block further attempts for 60 seconds (HTTP 429).

**IN SCOPE — Workspace:**
- Auto-provision a default `Workspace` + a root `Group` when a user registers (extend `AuthServiceImpl.register`).
- Read-only discovery is implicit (group tree starts from the root group).

**OUT OF SCOPE (do not implement now):** AI features, version history / snapshots, reminders UI/scheduler beyond what Bin needs, tags CRUD, full-text search, export, activity-feed endpoints (we *write* activity logs but don't expose a feed), real-time collaboration, OAuth login. Note **email/collaborator sharing of *notes*** is out of scope unless explicitly added later — only **group** email sharing is in scope (the `Collaborator` entity already covers notes if a later phase wants it).

---

## 1. Current codebase — what already exists

Package root: `lk.hemal.notly`. Java 17 / Spring Boot 3 / Maven / PostgreSQL / Spring Security + JWT / MapStruct / Lombok.

| Area | Status |
|---|---|
| `entity/BaseEntity` | UUID `id`, `createdAt`, `updatedAt`. All domain entities extend it (except `Collaborator`, `NoteTag`, `NoteMedia`, `Friend`, `BinItem`, `ActivityLog` which have their own `UUID id`). |
| `entity/User` | Done. Implements `UserDetails`. `getAuthorities()` returns `ROLE_USER` / `ROLE_ADMIN`. |
| `entity/Workspace` | `owner`, `name`, `isPublic`, `List<Group> groups`. Done. |
| `entity/Group` | `workspace`, `parent`, `children`, `name`, `sortOrder`, `isLocked`, `lockPasswordHash`, `isArchived`, `isFavorite`. **Missing fields** — see §3. |
| `entity/Note` | `group`, `owner`, `title`, `content`, `status` (`ACTIVE/ARCHIVED/DELETED`), `visibility` (`PRIVATE/SHARED/PUBLIC`), `isLocked`, `lockPasswordHash`, `isFavorite`, `deletedAt`. Has `@SQLDelete` + `@SQLRestriction("deleted_at IS NULL")` and `softDelete()` / `restore()` helpers. **Missing fields** — see §3. |
| `entity/Collaborator` | note↔user, role `OWNER/EDITOR/VIEWER`, `invitedAt`, `acceptedAt`. **Class is package-private — make it `public`.** |
| `entity/NoteTag`, `entity/NoteMedia` | package-private; only touch if needed (Bin cascade references `NoteMedia`/`NoteTag` repos). Make `public` if a repo references them. |
| `entity/BinItem` | `owner`, `entityType` (`NOTE/GROUP`), `entityId`, `deletedAt`, `restoreDeadline = now+30d`. Use this for the Bin. Public already. |
| `entity/ActivityLog` | `user`, `entityType`, `entityId`, `action` (enum incl. `CREATED/UPDATED/DELETED/RESTORED/ARCHIVED/FAVORITED/LOCKED/UNLOCKED/SHARED/UNSHARED/VIEWED…`), `metadata` (jsonb `Map<String,Object>`). Public already. |
| `entity/Reminder` | public, extends BaseEntity. Only relevant for Bin cascade. |
| `repo/*` | **`UserRepo` extends `JpaRepository`.** All others (`GroupRepo`, `NoteRepo`, `WorkspaceRepo`, `CollaboratorRepo`, `BinItemRepo`, `ActivityLogRepo`, `ReminderRepo`, `NoteTagRepo`, `NoteMediaRepo`, `FriendRepo`) are **empty `interface Xxx {}` stubs — must be made `extends JpaRepository<Entity, UUID>`**. |
| `service/*` + `service/impl/*` | `AuthService(Impl)` done. `GroupService`, `NoteService`, `WorkspaceService`, `BinItemService`, `CollaboratorService`, `ActivityLogService`, `ReminderService`, `NoteMediaService`, `NoteTagService` are **empty interface stubs**. `service/impl/BaseService` is an empty class — ignore it (or delete). |
| `controller/AuthController` | Reference implementation for controller style (Swagger annotations, `@RequestMapping(ApiConfig.API_BASE_PATH + "/...")`, returns DTOs directly inside `ResponseEntity`). `TestController` exists for `/test`. |
| `dto/ApiResponse<T>` | Generic wrapper marked "legacy". **Do not use it for new endpoints** — return DTOs directly, matching `AuthController`. |
| `dto/request`, `dto/response` | `LoginRequestDto`, `RegisterRequestDto`, `RefreshRequestDto`, `AuthResponseDto`, `UserResponseDto`. Pattern: Lombok `@Data/@Getter/@Setter`, `jakarta.validation` annotations, `@Schema`, `@JsonProperty("snake_case")` for multi-word JSON keys. |
| `mapper/BaseMapper<E,D>` + `mapper/UserMapper` | MapStruct, `componentModel = "spring"`. |
| `exception/*` | `NotlyException(ErrorCode, message?, cause?)` is the **only** exception to throw. `ErrorCode` enum + `GlobalExceptionHandler` (`@RestControllerAdvice`). See `src/main/java/lk/hemal/notly/exception/GUIDELINE.md`. **Add new `ErrorCode` constants — never new exception classes.** |
| `config/ApiConfig` | `API_BASE_PATH = "/api/v1"`. CORS config. |
| `config/security/SecurityConfig` | `/api/v1/auth/**`, `/api/v1/notes/public/**`, swagger, `/test`, `/` are `permitAll`. `/api/v1/notes/**` → `hasAuthority("USER")` ⚠️ **bug: principal authority is `ROLE_USER`, not `USER`, so this rule currently denies everyone — see §6.** `JwtAuthenticationFilter.shouldNotFilter` whitelists `/api/v1/notes/public/`. |
| `security/JwtAuthenticationFilter` | Sets `SecurityContext` principal to the `User` entity. In controllers use `@AuthenticationPrincipal User currentUser`. |
| `util/JwtUtil` | `generateAccessToken/RefreshToken`, `buildToken(claims, subject, expiryMs)`, `isTokenValid`, `extractUserId`, `extractClaim` (private). Reuse `getSigningKey()` style for unlock tokens (you'll add a method). |
| `core/enums/*` | `PermissionRole(OWNER/EDITOR/VIEWER)`, `Visibility`, `ItemStatus(ACTIVE/ARCHIVED/DELETED)`, `ActivityType`, `PriorityLevel` — partially redundant with entity-inner enums. **Convention for this plan:** keep using the entity-inner enums that already exist (`Note.NoteStatus`, `Note.Visibility`, `Collaborator.CollaboratorRole`, `ActivityLog.ActivityAction`). For new shared enums (`Group.Visibility`, `GroupCollaborator.Role`) mirror the Note ones. Don't refactor the `core/enums` package — just don't add to the confusion. |
| `application.yml` | Postgres remote DB, `ddl-auto: update` (so new entity columns auto-migrate — no Flyway). JWT secret + expiries. |

---

## 2. Conventions you MUST follow

1. **Layering:** Controller → Service interface → ServiceImpl → Repo. Controllers are thin (validation + delegation). Business rules + authorization checks live in the service.
2. **No try/catch in controllers.** Throw `NotlyException(ErrorCode.X, "context message")`; `GlobalExceptionHandler` formats it.
3. **Validation:** `@Valid @RequestBody` on controller params; `jakarta.validation` annotations on request DTOs. Cross-field / business validation → in the service, throwing `NotlyException(ErrorCode.BAD_REQUEST, …)` or a more specific code.
4. **Responses:** return the response DTO directly inside `ResponseEntity` (e.g. `ResponseEntity.ok(dto)`, `ResponseEntity.status(HttpStatus.CREATED).body(dto)`, `ResponseEntity.noContent().build()`). Do **not** wrap in `ApiResponse`.
5. **Current user:** `@AuthenticationPrincipal User currentUser` in controllers; pass `currentUser` (or `currentUser.getId()`) into the service. Never trust an owner id from the request body.
6. **DTOs:** request DTOs in `dto/request`, response DTOs in `dto/response`. Multi-word JSON keys → `@JsonProperty("snake_case")` + `@Schema`. Never expose `lockPasswordHash`, `passwordHash`, raw entities, or `currentRefreshToken`.
7. **Mappers:** one MapStruct mapper per aggregate (`GroupMapper`, `NoteMapper`), `@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.WARN)`, extend `BaseMapper` where the shape fits; add custom `@Mapping`/default methods for computed fields (e.g. `isLocked → locked`, breadcrumb).
8. **Swagger:** annotate every controller class (`@Tag`) and method (`@Operation`, `@ApiResponses` with `ErrorResponse.class` for error cases) like `AuthController`.
9. **Transactions:** `@Transactional` on every mutating service method (create / update / move / archive / delete / lock / share / duplicate). Read-only methods: `@Transactional(readOnly = true)`.
10. **Logging:** `@Slf4j`; `log.info` on significant mutations (`"[GROUP] move id={} -> parent={}"`), `log.warn` on auth/lock failures. Never log passwords or tokens.
11. **Soft delete on Note:** the `@SQLRestriction("deleted_at IS NULL")` means normal JPQL/`findById` will **never** see a soft-deleted note. To touch Bin items use **native queries** (see §5.3) — `@SQLRestriction` is not applied to native SQL.
12. **Activity logging:** call `activityLogService.log(userId, entityType, entityId, action, metadataMapOrNull)` from mutating service methods. Keep it best-effort: a logging failure must not break the operation (catch + `log.warn` inside the activity service, or annotate the log write so a runtime error is swallowed).

---

## 3. Entity changes

### 3.1 `Group` — add fields

```java
// add to Group.java
@Enumerated(EnumType.STRING)
@Column(name = "visibility", nullable = false, length = 20)
private Visibility visibility = Visibility.PRIVATE;          // PRIVATE / SHARED / PUBLIC

@Column(name = "is_secure", nullable = false)
private boolean isSecure = false;                            // vault mode

@Column(name = "share_token", unique = true, length = 64)
private String shareToken;                                   // UUID string when visibility=PUBLIC, else null

@Column(name = "archived_at")
private LocalDateTime archivedAt;

@Column(name = "deleted_at")
private LocalDateTime deletedAt;

public enum Visibility { PRIVATE, SHARED, PUBLIC }
```

Also add (mirror `Note`):

```java
@org.hibernate.annotations.SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.SQLDelete(sql = "UPDATE groups SET deleted_at = NOW() WHERE id = ?")
// ... on the class

public void softDelete() { this.deletedAt = LocalDateTime.now(); }
public void restore()    { this.deletedAt = null; }
```

> ⚠️ Adding `@SQLRestriction` to `Group` means `parent`/`children` navigation and tree queries also skip soft-deleted rows automatically — that's what we want. Bin lookups for groups use native queries (§5.3).

Keep the existing `children` `@OneToMany(mappedBy="parent", cascade = ALL)`. **Do not** rely on `cascade=ALL` for soft-delete — handle subtree soft-delete recursively in the service (so `BinItem` rows are created per node and `ddl-auto` doesn't physically delete anything).

Optionally **enable the `notes` relation** that's currently commented out in `Group` (`@OneToMany(mappedBy="group")`) — but you can also just query `noteRepo.findByGroupId(...)`. Querying is simpler; prefer that and leave the relation commented.

### 3.2 `Note` — add fields

```java
// add to Note.java
@Column(name = "share_token", unique = true, length = 64)
private String shareToken;                                   // UUID string when visibility=PUBLIC

@Column(name = "archived_at")
private LocalDateTime archivedAt;

@Column(name = "sort_order", nullable = false)
private int sortOrder = 0;                                   // ordering within a group (optional but cheap)
```

`Note` already has `deletedAt`, `softDelete()`, `restore()`. Leave the commented `tags/versions/collaborators/reminders/mediaFiles` relations commented — use repos.

### 3.3 New entity: `GroupCollaborator` (for sharing a group with a person by email)

Mirror `Collaborator` (standalone `UUID id`, not `BaseEntity`):

```java
@Entity
@Table(name = "group_collaborators",
    uniqueConstraints = @UniqueConstraint(name = "uq_group_collab_group_user", columnNames = {"group_id","user_id"}),
    indexes = { @Index(name="idx_group_collab_group", columnList="group_id"),
                @Index(name="idx_group_collab_user",  columnList="user_id") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class GroupCollaborator {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name="group_id", nullable=false)
    private Group group;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name="user_id", nullable=false)
    private User user;
    @Enumerated(EnumType.STRING) @Column(name="role", nullable=false, length=20)
    private Role role = Role.VIEWER;
    @Column(name="invited_at", nullable=false, updatable=false)
    private LocalDateTime invitedAt = LocalDateTime.now();
    @Column(name="accepted_at")
    private LocalDateTime acceptedAt;                          // for now, set = invitedAt at creation (no invite-accept flow)
    public enum Role { OWNER, EDITOR, VIEWER }
}
```

> Email of a non-registered user → respond with `SHARE_TARGET_NOT_FOUND` (no email-sending infra in this project). Document this limitation in the endpoint's Swagger description.

### 3.4 Make package-private entities public

`Collaborator`, and `NoteTag`/`NoteMedia` **only if** their repos are referenced from the Bin cascade — make those classes `public`.

---

## 4. New `ErrorCode` constants

Add to `exception/ErrorCode.java` (do not reuse numeric suffixes within a prefix). Use `org.springframework.http.HttpStatus`.

```java
// Workspace / Group / Note resources
WORKSPACE_NOT_FOUND   ("WS_001",   HttpStatus.NOT_FOUND,   "Workspace not found"),
GROUP_NOT_FOUND       ("GRP_001",  HttpStatus.NOT_FOUND,   "Group not found"),
NOTE_NOT_FOUND        ("NOTE_001", HttpStatus.NOT_FOUND,   "Note not found"),

// Group structure
CIRCULAR_GROUP_REFERENCE("GRP_002", HttpStatus.BAD_REQUEST, "Cannot move a group into itself or one of its descendants"),
ROOT_GROUP_PROTECTED  ("GRP_003",  HttpStatus.BAD_REQUEST, "The root group cannot be moved, deleted, or archived"),

// Lock / secure
INVALID_LOCK_PASSWORD ("LOCK_001", HttpStatus.UNAUTHORIZED, "Incorrect password"),
ITEM_NOT_LOCKED       ("LOCK_002", HttpStatus.BAD_REQUEST,  "This item is not locked"),
ITEM_ALREADY_LOCKED   ("LOCK_003", HttpStatus.CONFLICT,     "This item is already locked"),
TOO_MANY_UNLOCK_ATTEMPTS("LOCK_004", HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 60 seconds"),
ITEM_LOCKED           ("LOCK_005", HttpStatus.FORBIDDEN,    "This item is locked. Unlock it first"),
INVALID_UNLOCK_TOKEN  ("LOCK_006", HttpStatus.FORBIDDEN,    "Missing or invalid unlock token"),

// Sharing
INVALID_SHARE_TOKEN   ("SHR_001",  HttpStatus.NOT_FOUND,   "Invalid or revoked share link"),
SHARE_TARGET_NOT_FOUND("SHR_002",  HttpStatus.NOT_FOUND,   "No registered user with that email"),
CANNOT_SHARE_WITH_SELF("SHR_003",  HttpStatus.BAD_REQUEST, "You cannot share an item with yourself"),
ALREADY_SHARED        ("SHR_004",  HttpStatus.CONFLICT,    "Already shared with this user"),
COLLABORATOR_NOT_FOUND("SHR_005",  HttpStatus.NOT_FOUND,   "Collaborator not found"),

// Bin
BIN_ITEM_NOT_FOUND    ("BIN_001",  HttpStatus.NOT_FOUND,   "Item not found in bin"),
BIN_RESTORE_EXPIRED   ("BIN_002",  HttpStatus.GONE,        "This item's 30-day restore window has expired"),
```

Use the existing `FORBIDDEN` (`AUTH_005`) for ownership failures ("You do not have permission to modify this group").

---

## 5. Repository layer

Make each empty repo `extends JpaRepository<Entity, UUID>` and add the methods below. Keep query methods derived where possible; use `@Query` only when needed.

### 5.1 `GroupRepo extends JpaRepository<Group, UUID>`
```java
List<Group> findByWorkspaceIdAndParentIsNullOrderBySortOrderAsc(UUID workspaceId);   // root groups of a workspace
List<Group> findByParentIdOrderBySortOrderAsc(UUID parentId);                          // direct children
Optional<Group> findByIdAndWorkspaceOwnerId(UUID id, UUID ownerId);                    // ownership-scoped fetch
List<Group> findByWorkspaceOwnerIdOrderBySortOrderAsc(UUID ownerId);                   // all the user's groups (for building the tree in memory)
Optional<Group> findByShareTokenAndVisibility(String shareToken, Group.Visibility visibility);
int countByParentId(UUID parentId);
boolean existsByParentIdAndNameIgnoreCase(UUID parentId, String name);                 // optional: prevent dup sibling names
// max sortOrder among siblings (for append):
@Query("select coalesce(max(g.sortOrder), -1) from Group g where (:parentId is null and g.parent is null) or g.parent.id = :parentId")
int maxSortOrderAmongSiblings(@Param("parentId") UUID parentId);
// Bin: load a soft-deleted group (bypasses @SQLRestriction)
@Query(value = "SELECT * FROM groups WHERE id = ?1", nativeQuery = true)
Optional<Group> findRawById(UUID id);
@Modifying @Query(value = "UPDATE groups SET deleted_at = NULL WHERE id = ?1", nativeQuery = true)
void restoreRaw(UUID id);
@Modifying @Query(value = "DELETE FROM groups WHERE id = ?1", nativeQuery = true)
void hardDelete(UUID id);
```

### 5.2 `NoteRepo extends JpaRepository<Note, UUID>`
```java
List<Note> findByGroupIdOrderBySortOrderAscCreatedAtAsc(UUID groupId);                 // notes in a group (active only, via @SQLRestriction)
Optional<Note> findByIdAndOwnerId(UUID id, UUID ownerId);
List<Note> findByOwnerIdAndStatus(UUID ownerId, Note.NoteStatus status);               // e.g. ARCHIVED list
Optional<Note> findByShareTokenAndVisibility(String shareToken, Note.Visibility visibility);
@Query("select coalesce(max(n.sortOrder), -1) from Note n where n.group.id = ?1")
int maxSortOrderInGroup(UUID groupId);
long countByGroupId(UUID groupId);
// Bin / soft-deleted lookups (bypass @SQLRestriction)
@Query(value = "SELECT * FROM notes WHERE id = ?1", nativeQuery = true)
Optional<Note> findRawById(UUID id);
@Query(value = "SELECT * FROM notes WHERE owner_id = ?1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC", nativeQuery = true)
List<Note> findDeletedByOwner(UUID ownerId);
@Modifying @Query(value = "UPDATE notes SET deleted_at = NULL, status = 'ACTIVE' WHERE id = ?1", nativeQuery = true)
void restoreRaw(UUID id);
@Modifying @Query(value = "DELETE FROM notes WHERE id = ?1", nativeQuery = true)
void hardDelete(UUID id);
```

### 5.3 Other repos
- `WorkspaceRepo extends JpaRepository<Workspace, UUID>`: `Optional<Workspace> findFirstByOwnerIdOrderByCreatedAtAsc(UUID ownerId);` (the "default workspace"), `List<Workspace> findByOwnerId(UUID ownerId);`
- `BinItemRepo extends JpaRepository<BinItem, UUID>`: `List<BinItem> findByOwnerIdOrderByDeletedAtDesc(UUID ownerId);` `Optional<BinItem> findByOwnerIdAndEntityTypeAndEntityId(UUID ownerId, BinItem.EntityType type, UUID entityId);` `List<BinItem> findByRestoreDeadlineBefore(LocalDateTime cutoff);` `void deleteByEntityTypeAndEntityId(BinItem.EntityType type, UUID entityId);`
- `ActivityLogRepo extends JpaRepository<ActivityLog, UUID>` (no extra methods needed for this scope; `deleteByEntityTypeAndEntityId(...)` for cascade).
- `CollaboratorRepo extends JpaRepository<Collaborator, UUID>`: `void deleteByNoteId(UUID noteId);` (cascade) — plus the standard ones if note-sharing is added later.
- `GroupCollaboratorRepo extends JpaRepository<GroupCollaborator, UUID>`: `List<GroupCollaborator> findByGroupId(UUID groupId);` `Optional<GroupCollaborator> findByGroupIdAndUserId(UUID groupId, UUID userId);` `boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);` `void deleteByGroupId(UUID groupId);` `void deleteByGroupIdAndUserId(UUID groupId, UUID userId);`
- `ReminderRepo extends JpaRepository<Reminder, UUID>`: `void deleteByNoteId(UUID noteId);`
- `NoteTagRepo extends JpaRepository<NoteTag, UUID>`: `void deleteByNoteId(UUID noteId);` (make `NoteTag` public).
- `NoteMediaRepo extends JpaRepository<NoteMedia, UUID>`: `void deleteByNoteId(UUID noteId);` (make `NoteMedia` public).
- `FriendRepo`: leave as a JpaRepository stub (not used in this scope).

---

## 6. Security config changes

In `SecurityConfig.securityFilterChain`:

```java
// public read of shared content (no auth)
.requestMatchers(ApiConfig.API_BASE_PATH + "/notes/public/**",
                 ApiConfig.API_BASE_PATH + "/groups/public/**").permitAll()
// authenticated app endpoints — use hasAuthority("ROLE_USER") OR (simpler & robust) authenticated():
.requestMatchers(ApiConfig.API_BASE_PATH + "/groups/**",
                 ApiConfig.API_BASE_PATH + "/notes/**",
                 ApiConfig.API_BASE_PATH + "/workspaces/**",
                 ApiConfig.API_BASE_PATH + "/bin/**").authenticated()
```

> ⚠️ The existing rule `.requestMatchers(API_BASE_PATH + "/notes/**").hasAuthority("USER")` is broken — the granted authority is `ROLE_USER`, so `hasAuthority("USER")` matches nothing. Either change it to `.hasAuthority("ROLE_USER")` / `.hasRole("USER")`, or replace with `.authenticated()` (recommended for this scope). Pick one and apply it consistently to the new paths above.

In `JwtAuthenticationFilter.shouldNotFilter`, also whitelist `/api/v1/groups/public/` so the public group endpoint isn't blocked by a stale/expired bearer header.

---

## 7. Implementation phases

Do them in order. Each phase ends compilable + Postman-testable.

### Phase 0 — Foundation
1. Make all repos `extends JpaRepository<…, UUID>` with the methods in §5; make `Collaborator` (and `NoteTag`/`NoteMedia` if referenced) `public`.
2. Add the new `ErrorCode` constants (§4).
3. Add the new entity fields + `GroupCollaborator` (§3); rely on `ddl-auto: update` to migrate.
4. **Workspace auto-provisioning:** in `AuthServiceImpl.register`, after `userRepo.save(user)`:
   - create `Workspace { owner=user, name="My Workspace", isPublic=false }` → save;
   - create root `Group { workspace, parent=null, name="Workspace", sortOrder=0 }` → save;
   - keep it inside the existing `@Transactional` so register stays atomic.
   Add a `WorkspaceService.getOrCreateDefaultWorkspace(User)` helper (used here and as a fallback elsewhere).
   *(Existing users created before this change have no workspace — `getOrCreateDefaultWorkspace` lazily creates one on first group/note call. Implement that fallback.)*
5. `ActivityLogService.log(UUID userId, ActivityLog.EntityType type, UUID entityId, ActivityLog.ActivityAction action, Map<String,Object> metadata)` + `ActivityLogServiceImpl` (best-effort; swallow + `log.warn` on failure). Also `deleteForEntity(EntityType, UUID)` for cascade.
6. Security config + `shouldNotFilter` updates (§6).
7. `WorkspaceController` (`@RequestMapping(ApiConfig.API_BASE_PATH + "/workspaces")`): `GET /workspaces` (list owned), `GET /workspaces/{id}` (owned only, else `WORKSPACE_NOT_FOUND`). Return `WorkspaceResponse { id, name, isPublic, createdAt }`.

**Test:** register → DB has `workspaces` + root `groups` row → `GET /api/v1/workspaces` returns it.

### Phase 1 — Group core CRUD + nested tree
Service `GroupService` / `GroupServiceImpl`, controller `GroupController` (`/api/v1/groups`), `GroupMapper`.

Helpers in `GroupServiceImpl`:
- `private Group requireOwnedGroup(UUID groupId, User user)` → `groupRepo.findByIdAndWorkspaceOwnerId(groupId, user.getId()).orElseThrow(() -> new NotlyException(GROUP_NOT_FOUND, "Group "+groupId+" not found"))`. Use everywhere a group is touched.
- `private void assertNotRoot(Group g)` → if `g.getParent() == null` throw `ROOT_GROUP_PROTECTED` (used by move/delete/archive — renaming the root is allowed).

Endpoints:

| Method & path | Body | Behaviour |
|---|---|---|
| `POST /groups` | `CreateGroupRequest { name (required, 1..100), parent_id? (UUID, null→root of default workspace), is_secure? (default false), password? (required iff is_secure or you want it locked) }` | Resolve workspace = parent's workspace, or default workspace if `parent_id` null. Validate parent is owned (else `GROUP_NOT_FOUND`). `sortOrder = maxSortOrderAmongSiblings(parentId)+1`. If `is_secure==true` (or `password` present): `password` required & length ≥ 6 → `isSecure=true` (when requested), `isLocked=true`, `lockPasswordHash = passwordEncoder.encode(password)`. Save. Log `CREATED`. → `201` + `GroupResponse`. |
| `GET /groups/{id}` | — | Owned group. If the group (or any ancestor) is locked/secure and **no valid unlock token** is supplied (header `X-Unlock-Token`), return the group metadata with `locked=true` and **omit nothing sensitive anyway** (group metadata isn't secret) — but **do not** list children/notes of a locked group without an unlock token (those endpoints enforce it). → `GroupResponse`. |
| `GET /groups/{id}/children` | — | Owned group; enforce unlock if the group is locked/secure (see Phase 5). Returns `{ groups: [GroupResponse...], notes: [NoteSummaryResponse...] }` (notes via `noteRepo.findByGroupId...`, only `status=ACTIVE`). |
| `GET /groups/tree` | query `?workspace_id=` optional | Build the full nested tree for the user (`groupRepo.findByWorkspaceOwnerId...`) in memory: group by `parent.id`, attach children recursively starting from root(s). Return `GroupTreeNode { id, name, isLocked, isSecure, isFavorite, isArchived, sortOrder, children: [GroupTreeNode...] }`. **Do not** recurse into the DB per node. Locked groups still appear in the tree (only their *contents* are gated). |
| `GET /groups/{id}/breadcrumb` | — | Walk `parent` up to root; return ordered list root→…→self: `[BreadcrumbItem { id, name }]`. |
| `PATCH /groups/{id}` | `UpdateGroupRequest { name? (1..100) }` | Rename. Root group may be renamed. Log `UPDATED` with `{ "old_name": ... }`. → `GroupResponse`. |
| `GET /groups/{id}/stats` | — | `GroupStatsResponse { directNoteCount, directSubgroupCount, totalNoteCount(recursive), lastActivityAt }`. Recursive counts: walk the in-memory tree. |

`GroupResponse` fields: `id, name, parent_id, workspace_id, sort_order, is_locked, is_secure, is_favorite, is_archived, visibility, created_at, updated_at`. **Never** include `lockPasswordHash` or `shareToken` here (shareToken only via the share endpoint response).

**Test:** create nested groups, fetch tree, breadcrumb, rename.

### Phase 2 — Note core CRUD + autosave
Service `NoteService`/`NoteServiceImpl`, controller `NoteController` (`/api/v1/notes`), `NoteMapper`.

Helper: `private Note requireOwnedNote(UUID noteId, User user)` → `noteRepo.findByIdAndOwnerId(...).orElseThrow(NOTE_NOT_FOUND)`. (Soft-deleted notes won't be found — correct.)

| Method & path | Body | Behaviour |
|---|---|---|
| `POST /notes` | `CreateNoteRequest { group_id (required, owned), title? (default "Untitled", ≤500), content? (default ""/empty Tiptap JSON) }` | Validate group owned + not locked-without-token (enforce unlock if the group is locked/secure). Owner = currentUser. `status=ACTIVE`, `visibility=PRIVATE`, `sortOrder = maxSortOrderInGroup(groupId)+1`. If the group is `isSecure`, the note is implicitly secured by the group (no own password needed) — nothing special to store on the note. Log `CREATED`. → `201` + `NoteResponse`. |
| `GET /notes/{id}` | — | Owned note. If the note `isLocked` **or** its group/an ancestor is `isLocked`/`isSecure` → require a valid `X-Unlock-Token` for that note (or for the gating group). Without it: `403 ITEM_LOCKED` (frontend then shows the password screen) — return only `{ id, title, locked:true }` or just throw; pick throw `ITEM_LOCKED` to keep it simple. With a valid token: full `NoteResponse` incl. `content`. On successful content fetch, log `VIEWED` (skip logging for the owner if you want to reduce noise — optional). |
| `GET /notes?group_id=` or `GET /groups/{id}/children` | — | List active notes in a group as `NoteSummaryResponse` (no `content`). |
| `GET /notes?status=ARCHIVED` | — | `noteRepo.findByOwnerIdAndStatus(uid, ARCHIVED)` → list of `NoteSummaryResponse`. |
| `PATCH /notes/{id}` | `UpdateNoteRequest { title?, content? }` (**autosave** — partial; at least one field) | Owned note; enforce unlock if locked/secure. Apply only non-null fields. `updatedAt` auto-bumps. Log `UPDATED` **at most occasionally** — autosave fires every 2s; either skip activity logging on PATCH or throttle (e.g. only log if `updatedAt` older than 5 min). → `NoteResponse` (or `204` — but returning the saved note lets the client confirm; return `200 NoteResponse`). |
| `DELETE /notes/{id}` | — | Soft-delete → see Phase 4. |

`NoteResponse` fields: `id, group_id, owner: UserResponseDto (or just owner_id + owner_name), title, content, status, visibility, is_locked, is_favorite, sort_order, created_at, updated_at`. Never include `lockPasswordHash`/`shareToken`. `NoteSummaryResponse`: same minus `content` (plus maybe a `content_preview` = first 200 chars stripped — optional, nice for the frontend).

**Test:** create note in a group, GET, PATCH (autosave), list by group.

### Phase 3 — Move / reorder / duplicate / copy
Add to `GroupService` and `NoteService`.

**Group move** — `POST /groups/{id}/move` body `MoveGroupRequest { target_parent_id? (null = move to root of the same workspace), sort_order? }`:
- Owned group; `assertNotRoot`. Target parent (if non-null) owned & in the same workspace (keep it simple: forbid cross-workspace moves → `BAD_REQUEST`).
- **Circular-reference check:** the target parent must not be the group itself nor any of its descendants. Implement with the in-memory subtree (you already load the user's groups for the tree) or:
```java
private boolean isSelfOrDescendant(UUID candidateAncestorId, UUID nodeId) {
    if (candidateAncestorId.equals(nodeId)) return true;
    Group n = groupRepo.findById(nodeId).orElse(null);
    while (n != null && n.getParent() != null) {
        if (n.getParent().getId().equals(candidateAncestorId)) return true;
        n = groupRepo.findById(n.getParent().getId()).orElse(null);
    }
    return false;
}
// reject if isSelfOrDescendant(groupId, targetParentId) -> CIRCULAR_GROUP_REFERENCE
```
- Set `parent`, recompute `sortOrder` (= given `sort_order`, or append = `maxSortOrderAmongSiblings(targetParentId)+1`). Save. Log `UPDATED` with metadata `{ "from_parent": oldParentId, "to_parent": newParentId }`. → `GroupResponse`.

**Group reorder** — `POST /groups/{id}/reorder` body `{ sort_order (int) }` (or `{ before_sibling_id }` / `{ after_sibling_id }` — pick the simplest: just set an absolute `sort_order` and let the client send a full re-numbering if it cares). Validate same parent. → `GroupResponse`.

**Group duplicate** — `POST /groups/{id}/duplicate` body `{ target_parent_id? }` (default = same parent): deep copy. New group name = `"<name> (copy)"`. Recursively copy descendant groups + their notes (`title`, `content`, `visibility=PRIVATE`, `isFavorite=false`, **do not copy locks/secure flags or share tokens** — the copy is unlocked & private). Owner of copied notes = currentUser. Log `CREATED` on the new root copy. → `201` + `GroupResponse` of the new top-level copy. Guard against pathological depth (e.g. cap at 50 levels → `BAD_REQUEST`).

**Note move** — `POST /notes/{id}/move` body `MoveNoteRequest { target_group_id (required, owned), sort_order? }`: owned note; target group owned & not locked-without-token. Set `group`, recompute `sortOrder`. Log `UPDATED` `{ "from_group":..., "to_group":... }`. → `NoteResponse`.

**Note duplicate** — `POST /notes/{id}/duplicate`: copy in the same group, title `"<title> (copy)"`, content copied, `visibility=PRIVATE`, `isLocked=false`, `isFavorite=false`, no `shareToken`. → `201` + `NoteResponse`.

**Note copy-to-folder** — `POST /notes/{id}/copy` body `{ target_group_id (required, owned) }`: same as duplicate but into a different group; original untouched. → `201` + `NoteResponse`.

(Optional `POST /notes/{id}/reorder` mirrors group reorder.)

**Test:** move a note across groups; move a group; attempt a circular move → expect `GRP_002`; duplicate a group with notes.

### Phase 4 — Archive + Bin (soft delete) + 30-day purge scheduler
New service `BinService`/`BinServiceImpl` + controller `BinController` (`/api/v1/bin`). Archive lives on `GroupService`/`NoteService`.

**Archive (Note):** `POST /notes/{id}/archive` → `status=ARCHIVED`, `archivedAt=now`. `POST /notes/{id}/unarchive` → `status=ACTIVE`, `archivedAt=null`, and if the original group is gone/archived, move it to the user's root group ("Workspace"). Log `ARCHIVED`/`RESTORED`. → `NoteResponse`. (Archived notes are excluded from `findByGroupId...` listings — add `AndStatus(ACTIVE)` to that query, or filter in code.)

**Archive (Group):** `POST /groups/{id}/archive` → `assertNotRoot`; set `isArchived=true`, `archivedAt=now` on the group **and recursively** on all descendant groups, and `status=ARCHIVED` on all notes within the subtree. `POST /groups/{id}/unarchive` → reverse it (recursively). Log accordingly. → `GroupResponse`.

**Soft-delete (Note):** `DELETE /notes/{id}` →
1. `note.softDelete()` (sets `deletedAt`, `status=DELETED`); `noteRepo.save(note)`.
2. Create `BinItem { owner=currentUser, entityType=NOTE, entityId=note.id, deletedAt=now, restoreDeadline=now+30d }`; save.
3. Log `DELETED`.
4. → `204 No Content` (or `200` + `{ "restorable_until": ... }` so the frontend can show the "Undo" toast — return the latter).

Because of `@SQLRestriction`, the note now vanishes from all normal queries. ✔

**Soft-delete (Group):** `DELETE /groups/{id}` → `assertNotRoot`. **Recursive subtree soft-delete:** for the group and every descendant group: `group.softDelete()`, `groupRepo.save`; for every note in the subtree: `note.softDelete()`, `noteRepo.save`. Create **one** `BinItem { entityType=GROUP, entityId=rootOfDeletedSubtree }` (restoring it restores the whole subtree). Optionally also create per-note `BinItem`s — **don't**; one GROUP bin item is cleaner. Log `DELETED`. → `204`/`200`.

**Bin endpoints (`/api/v1/bin`):**
| Method & path | Behaviour |
|---|---|
| `GET /bin` | `binItemRepo.findByOwnerIdOrderByDeletedAtDesc(uid)`. For each, hydrate a title: NOTE → `noteRepo.findRawById(entityId)` (native, ignores `@SQLRestriction`) → title; GROUP → `groupRepo.findRawById(entityId)` → name. Compute `days_left = max(0, DAYS between now and restoreDeadline)`. Return `[BinItemResponse { id, entity_type, entity_id, title, deleted_at, restore_deadline, days_left, original_group_id? }]`. Sort soonest-to-expire? — spec says yes; sort by `restoreDeadline` asc instead of `deletedAt` desc if you want to match the spec exactly. |
| `POST /bin/{binItemId}/restore` | Owned bin item, not expired (`restoreDeadline > now`, else `BIN_RESTORE_EXPIRED`). NOTE → `noteRepo.restoreRaw(entityId)`; if its group no longer exists / is soft-deleted, also reassign to the user's root group (native update). GROUP → recursively `restoreRaw` the group subtree + all notes inside it (native, since they're hidden); if the parent of the restored root is gone, set parent = root group. Delete the `BinItem`. Log `RESTORED`. → `200` + the restored entity's response, or `{ restored: true, type, id }`. |
| `DELETE /bin/{binItemId}` (permanent) | Owned bin item. NOTE → cascade delete dependents then `noteRepo.hardDelete(entityId)`. GROUP → for the whole soft-deleted subtree: delete each note's dependents + hard-delete notes, then hard-delete groups bottom-up. Then delete the `BinItem`. Log `DELETED`. → `204`. |
| `DELETE /bin` (empty bin) | Permanently delete every bin item for the user (loop the above). → `204`. |

**Cascade delete for a note** (used by permanent-delete + scheduler):
```
collaboratorRepo.deleteByNoteId(noteId);
reminderRepo.deleteByNoteId(noteId);
noteTagRepo.deleteByNoteId(noteId);          // if NoteTag wired
noteMediaRepo.deleteByNoteId(noteId);        // if NoteMedia wired (and clean up Cloudinary later — out of scope)
activityLogService.deleteForEntity(NOTE, noteId);
noteRepo.hardDelete(noteId);
```

**Scheduler** — new `scheduler/BinPurgeScheduler` (`@Component`), and add `@EnableScheduling` to `NotlyServerApplication` (or a `@Configuration`):
```java
@Scheduled(cron = "0 0 3 * * *")   // daily at 03:00
@Transactional
public void purgeExpiredBinItems() {
    LocalDateTime now = LocalDateTime.now();
    for (BinItem item : binItemRepo.findByRestoreDeadlineBefore(now)) {
        // same logic as permanent delete, per entity type
        ...
        binItemRepo.delete(item);
    }
    log.info("[BIN] purged {} expired items", count);
}
```

**Test:** delete a note → appears in `GET /bin` with `days_left≈30` → restore → it's back in its group. Delete a group subtree → one bin item → restore → whole subtree returns. Permanent-delete → gone, dependents gone.

### Phase 5 — Lock / unlock + Secure Group/Note + rate-limit cooldown

Two new beans:

**`UnlockTokenService`** — issues short-lived signed tokens proving "user U unlocked entity E". Reuse the JWT machinery: add to `JwtUtil` (or a small new util) a method `generateUnlockToken(UUID userId, String entityType, UUID entityId, long ttlMs)` building a JWT with claims `{ type:"UNLOCK", ent:entityType, eid:entityId.toString() }`, subject = userId, exp = now + ttl (use ~2h: `jwt.unlock-token-expiry: 7200000` in `application.yml`). And `boolean isUnlockTokenValid(String token, UUID userId, String entityType, UUID entityId)`. Frontend sends it back in header `X-Unlock-Token`. Controllers read it via `@RequestHeader(value="X-Unlock-Token", required=false) String unlockToken` and pass it to the service.

**`LockAttemptService`** — in-memory rate limiter:
```java
record Attempt(int count, Instant blockedUntil) {}
ConcurrentHashMap<String, Attempt> map;   // key = entityType + ":" + entityId + ":" + userId
void assertNotBlocked(key)   // if blockedUntil in future -> throw TOO_MANY_UNLOCK_ATTEMPTS
void recordFailure(key)      // count++; if count >= 5 -> blockedUntil = now+60s, reset count
void recordSuccess(key)      // remove key
```
(In-memory is fine for a single-instance student app; note this in a code comment. No Redis.)

**Gating logic — `requireUnlocked(...)`:** a note is *accessible* iff: (a) the note is not locked, AND (b) no ancestor group is `isLocked`/`isSecure` — OR the caller supplied a valid `X-Unlock-Token` for the note itself or for the **nearest gating ancestor group**. Implement a helper:
```java
// throws ITEM_LOCKED if a gate is closed and no valid token is provided
void assertNoteAccessible(Note note, User user, String unlockToken) {
    if (note.isLocked() && validUnlock(unlockToken, "NOTE", note.getId(), user)) return-ok-for-note-gate;
    // walk ancestors:
    for (Group g = note.getGroup(); g != null; g = g.getParent())
        if (g.isLocked() || g.isSecure())
            if (!validUnlock(unlockToken, "GROUP", g.getId(), user)) throw ITEM_LOCKED;
    if (note.isLocked() && !validUnlock(unlockToken, "NOTE", note.getId(), user)) throw ITEM_LOCKED;
}
```
(Keep it simple: a single `X-Unlock-Token` header per request; the client sends whichever one it has. If a note is inside two nested secure groups, the client may need to unlock both — acceptable; document it. Or accept a comma-separated list of tokens — optional polish.)

**Endpoints (apply identically to `/notes/{id}/...` and `/groups/{id}/...`):**

| Method & path | Body | Behaviour |
|---|---|---|
| `POST /{notes\|groups}/{id}/lock` | `LockRequest { password (required, ≥6), make_secure? (groups only — sets isSecure=true) }` | Owned item; if already `isLocked` → `ITEM_ALREADY_LOCKED`. `lockPasswordHash = passwordEncoder.encode(password)`, `isLocked=true`, (groups) `isSecure = make_secure`. Log `LOCKED`. → `200` (no body, or `{ locked:true }`). |
| `POST /{notes\|groups}/{id}/unlock` | `UnlockRequest { password (required) }` | Owned item; if not `isLocked` & not `isSecure` → `ITEM_NOT_LOCKED`. `lockAttemptService.assertNotBlocked(key)`. If `passwordEncoder.matches(password, hash)` → `recordSuccess`; issue unlock token; log `UNLOCKED`; → `200 UnlockTokenResponse { unlock_token, expires_in_seconds }`. Else → `recordFailure(key)`; → `INVALID_LOCK_PASSWORD` (or `TOO_MANY_UNLOCK_ATTEMPTS` if that pushed it over the limit). |
| `PUT /{notes\|groups}/{id}/lock` | `ChangeLockRequest { current_password (required), new_password (required, ≥6) }` | Owned item; must be locked. Verify `current_password` (subject to rate-limit). Re-hash `new_password`. Existing unlock tokens stay valid until expiry (acceptable; or change the JWT to include a per-item version claim — out of scope). Log `UPDATED` (`{ "lock":"password_changed" }`). → `200`. |
| `DELETE /{notes\|groups}/{id}/lock` | `UnlockRequest { password (required) }` | Owned item; must be locked. Verify password (rate-limited). `isLocked=false`, `lockPasswordHash=null`, (groups) `isSecure=false`. Log `UNLOCKED`. → `204`. |

**Secure Group creation** is just `POST /groups` with `is_secure=true` + `password` (Phase 1 already covers this — make sure it sets `isLocked=true` too). A note created inside a secure group needs no password but is gated by `assertNoteAccessible`. A note may *also* have its own lock → double layer, handled naturally by the walk above.

Wire `assertNoteAccessible` / the equivalent `assertGroupContentsAccessible` into: `GET /notes/{id}`, `PATCH /notes/{id}`, `POST /notes` (target group), `POST /notes/{id}/move` (target group), `GET /groups/{id}/children`, `GET /groups/{id}/stats`. **Metadata-only** endpoints (`GET /groups/{id}`, `GET /groups/tree`, `GET /groups/{id}/breadcrumb`) are **not** gated — they only expose names/flags.

**Test:** lock a note → `GET /notes/{id}` → `403 LOCK_005` → `POST /unlock` wrong password ×5 → `429 LOCK_004` → wait 60s → correct password → token → `GET /notes/{id}` with `X-Unlock-Token` → `200` with content. Create secure group, put a note in it, confirm the note is gated by the group's token.

### Phase 6 — Sharing

**6a — Note public link (in scope):**
| Method & path | Behaviour |
|---|---|
| `POST /notes/{id}/public-link` | Owned note; if locked → `ITEM_LOCKED` (don't allow public-sharing a locked note, or strip the lock — choose: reject with a clear message). `shareToken = UUID.randomUUID().toString()`, `visibility=PUBLIC`. Log `SHARED`. → `{ public_url_path: "/api/v1/notes/public/" + token, share_token: token }`. |
| `POST /notes/{id}/public-link/regenerate` | New token, old invalidated. → same shape. |
| `DELETE /notes/{id}/public-link` | `shareToken=null`, `visibility=PRIVATE`. Log `UNSHARED`. → `204`. |
| `GET /notes/public/{shareToken}` | **No auth** (already permitAll + `shouldNotFilter`). `noteRepo.findByShareTokenAndVisibility(token, PUBLIC)` → else `INVALID_SHARE_TOKEN`. Return `PublicNoteResponse { title, content, owner_display_name, owner_avatar_url, created_at, updated_at }` — **read-only, no ids of internal structure, no lock info**. Optionally increment a view counter (skip — no field for it; out of scope). |

**6b — Group public link (in scope):** same four endpoints under `/groups/{id}/public-link...` + `GET /groups/public/{shareToken}` (no auth) returning `PublicGroupResponse { name, owner_display_name, notes: [ { title, content } ... for notes whose own visibility != PRIVATE? ] }` — keep it minimal: list the group's notes' titles + content as a read-only bundle. Don't recurse into subgroups for the public view (or do, shallowly — your call; shallow is fine). A **locked/secure** group **cannot** be made public → reject.

**6c — Group share with a person by email (in scope):**
| Method & path | Body | Behaviour |
|---|---|---|
| `POST /groups/{id}/collaborators` | `ShareGroupRequest { email (required, valid), role (EDITOR\|VIEWER, default VIEWER) }` | Owned group. `userRepo.findByEmail(email)` → else `SHARE_TARGET_NOT_FOUND` (no email infra — say so in Swagger). If target == owner → `CANNOT_SHARE_WITH_SELF`. If `existsByGroupIdAndUserId` → `ALREADY_SHARED`. Create `GroupCollaborator { group, user=target, role, invitedAt=now, acceptedAt=now }`. Set group `visibility=SHARED`. Log `SHARED` (`{ "with": targetUserId, "role": role }`). → `201 GroupCollaboratorResponse { id, user: { id, display_name, email, avatar_url }, role, invited_at }`. |
| `GET /groups/{id}/collaborators` | — | Owned group → list `GroupCollaboratorResponse`. |
| `PUT /groups/{id}/collaborators/{userId}` | `{ role }` | Owned group; collaborator exists else `COLLABORATOR_NOT_FOUND`. Update role. → `200`. |
| `DELETE /groups/{id}/collaborators/{userId}` | — | Owned group; remove. If no collaborators left and not public → `visibility=PRIVATE`. Log `UNSHARED`. → `204`. |

> **Authorization note:** this scope does **not** yet make shared groups readable by the collaborator (no "Shared with me" listing, no permission-aware fetch). The collaborator records are created and manageable; wiring read-access for collaborators is a follow-up. State this explicitly in the controller Javadoc so it isn't mistaken for a finished feature.

**Test:** make a note public → fetch `/notes/public/{token}` anonymously → `200`. Revoke → `404 SHR_001`. Share a group with a registered user's email → `201`; with an unknown email → `404 SHR_002`; with yourself → `400 SHR_003`.

### Phase 7 — Favorites (small, do anytime after Phase 1/2)
- `POST /notes/{id}/favorite` → toggle `isFavorite`; log `FAVORITED`. → `NoteResponse`.
- `POST /groups/{id}/favorite` → toggle `isFavorite`; log `FAVORITED`. → `GroupResponse`.
- `GET /notes?favorite=true` and/or `GET /favorites` → list the user's favorited notes + groups: `{ groups:[GroupResponse...], notes:[NoteSummaryResponse...] }`.

---

## 8. Endpoint reference (full list)

All under `ApiConfig.API_BASE_PATH` = `/api/v1`. All require a Bearer token except the two `…/public/{token}` ones.

```
# Workspace
GET    /workspaces
GET    /workspaces/{id}

# Group — core
POST   /groups
GET    /groups/{id}
GET    /groups/{id}/children
GET    /groups/tree
GET    /groups/{id}/breadcrumb
GET    /groups/{id}/stats
PATCH  /groups/{id}                       # rename
# Group — structure
POST   /groups/{id}/move
POST   /groups/{id}/reorder
POST   /groups/{id}/duplicate
# Group — lifecycle
POST   /groups/{id}/archive
POST   /groups/{id}/unarchive
DELETE /groups/{id}                       # soft delete -> Bin
POST   /groups/{id}/favorite
# Group — lock / secure
POST   /groups/{id}/lock
POST   /groups/{id}/unlock                # -> unlock_token
PUT    /groups/{id}/lock                  # change password
DELETE /groups/{id}/lock                  # remove lock
# Group — sharing
POST   /groups/{id}/public-link
POST   /groups/{id}/public-link/regenerate
DELETE /groups/{id}/public-link
GET    /groups/public/{shareToken}        # no auth
POST   /groups/{id}/collaborators
GET    /groups/{id}/collaborators
PUT    /groups/{id}/collaborators/{userId}
DELETE /groups/{id}/collaborators/{userId}

# Note — core
POST   /notes
GET    /notes/{id}                        # gated by lock/secure; needs X-Unlock-Token header if locked
GET    /notes?group_id=...                # active notes in a group
GET    /notes?status=ARCHIVED             # archived notes
GET    /notes?favorite=true               # favorited notes
PATCH  /notes/{id}                        # autosave (partial title/content)
# Note — structure
POST   /notes/{id}/move
POST   /notes/{id}/duplicate
POST   /notes/{id}/copy                   # copy to a target group
POST   /notes/{id}/reorder                # optional
# Note — lifecycle
POST   /notes/{id}/archive
POST   /notes/{id}/unarchive
DELETE /notes/{id}                        # soft delete -> Bin
POST   /notes/{id}/favorite
# Note — lock
POST   /notes/{id}/lock
POST   /notes/{id}/unlock                 # -> unlock_token
PUT    /notes/{id}/lock                   # change password
DELETE /notes/{id}/lock                   # remove lock
# Note — sharing
POST   /notes/{id}/public-link
POST   /notes/{id}/public-link/regenerate
DELETE /notes/{id}/public-link
GET    /notes/public/{shareToken}         # no auth

# Bin
GET    /bin
POST   /bin/{binItemId}/restore
DELETE /bin/{binItemId}                   # permanent delete (single)
DELETE /bin                               # empty bin

# Favorites (alternative aggregate)
GET    /favorites                         # { groups:[...], notes:[...] }
```

---

## 9. DTO catalogue

All request DTOs: `@Data @NoArgsConstructor @AllArgsConstructor`, `jakarta.validation` annotations, `@Schema`, `@JsonProperty("snake_case")` for multi-word keys. All response DTOs: `@Getter @Setter @NoArgsConstructor @AllArgsConstructor`, `@Schema`.

**Requests** (`dto/request`):
- `CreateGroupRequest`: `@NotBlank @Size(max=100) name`; `@JsonProperty("parent_id") UUID parentId` (nullable); `@JsonProperty("is_secure") Boolean isSecure` (nullable→false); `@Size(min=6,max=128) String password` (nullable; required in service iff `isSecure==true`).
- `UpdateGroupRequest`: `@Size(min=1,max=100) String name` (nullable; require at least name present in service).
- `MoveGroupRequest`: `@JsonProperty("target_parent_id") UUID targetParentId` (nullable); `@JsonProperty("sort_order") Integer sortOrder` (nullable).
- `ReorderRequest`: `@NotNull @JsonProperty("sort_order") Integer sortOrder`.
- `DuplicateRequest`: `@JsonProperty("target_parent_id") UUID targetParentId` (nullable, groups) / `@JsonProperty("target_group_id") UUID targetGroupId` (notes — for `/copy`).
- `CreateNoteRequest`: `@NotNull @JsonProperty("group_id") UUID groupId`; `@Size(max=500) String title` (nullable→"Untitled"); `String content` (nullable→"").
- `UpdateNoteRequest`: `@Size(max=500) String title` (nullable); `String content` (nullable). Service: reject if both null → `BAD_REQUEST`.
- `MoveNoteRequest`: `@NotNull @JsonProperty("target_group_id") UUID targetGroupId`; `@JsonProperty("sort_order") Integer sortOrder` (nullable).
- `CopyNoteRequest`: `@NotNull @JsonProperty("target_group_id") UUID targetGroupId`.
- `LockRequest`: `@NotBlank @Size(min=6,max=128) String password`; `@JsonProperty("make_secure") Boolean makeSecure` (groups only, nullable→false).
- `UnlockRequest`: `@NotBlank String password`.
- `ChangeLockRequest`: `@NotBlank @JsonProperty("current_password") String currentPassword`; `@NotBlank @Size(min=6,max=128) @JsonProperty("new_password") String newPassword`.
- `ShareGroupRequest`: `@NotBlank @Email String email`; `GroupCollaborator.Role role` (nullable→VIEWER) — validate it's not `OWNER` in the service.
- `UpdateCollaboratorRoleRequest`: `@NotNull GroupCollaborator.Role role`.

**Responses** (`dto/response`):
- `WorkspaceResponse`: `id, name, isPublic, createdAt`.
- `GroupResponse`: `id, name`, `@JsonProperty("parent_id") parentId`, `@JsonProperty("workspace_id") workspaceId`, `@JsonProperty("sort_order") sortOrder`, `@JsonProperty("is_locked") locked`, `@JsonProperty("is_secure") secure`, `@JsonProperty("is_favorite") favorite`, `@JsonProperty("is_archived") archived`, `visibility`, `createdAt`, `updatedAt`.
- `GroupTreeNode`: `id, name, isLocked, isSecure, isFavorite, isArchived, sortOrder, List<GroupTreeNode> children`.
- `BreadcrumbItem`: `id, name`. (Endpoint returns `List<BreadcrumbItem>`.)
- `GroupStatsResponse`: `directNoteCount, directSubgroupCount, totalNoteCount, lastActivityAt`.
- `GroupChildrenResponse`: `List<GroupResponse> groups, List<NoteSummaryResponse> notes`.
- `NoteResponse`: `id`, `@JsonProperty("group_id") groupId`, `@JsonProperty("owner_id") ownerId`, `@JsonProperty("owner_name") ownerDisplayName`, `title`, `content`, `status`, `visibility`, `@JsonProperty("is_locked") locked`, `@JsonProperty("is_favorite") favorite`, `@JsonProperty("sort_order") sortOrder`, `createdAt`, `updatedAt`.
- `NoteSummaryResponse`: as `NoteResponse` minus `content` (+ optional `contentPreview`).
- `PublicNoteResponse`: `title, content`, `@JsonProperty("owner_name") ownerDisplayName`, `@JsonProperty("owner_avatar_url") ownerAvatarUrl`, `createdAt, updatedAt`.
- `PublicGroupResponse`: `name`, `@JsonProperty("owner_name") ownerDisplayName`, `List<PublicNoteResponse> notes`.
- `UnlockTokenResponse`: `@JsonProperty("unlock_token") unlockToken`, `@JsonProperty("expires_in_seconds") expiresInSeconds`.
- `BinItemResponse`: `id`, `@JsonProperty("entity_type") entityType`, `@JsonProperty("entity_id") entityId`, `title`, `@JsonProperty("deleted_at") deletedAt`, `@JsonProperty("restore_deadline") restoreDeadline`, `@JsonProperty("days_left") daysLeft`, `@JsonProperty("original_group_id") originalGroupId` (nullable).
- `ShareLinkResponse`: `@JsonProperty("share_token") shareToken`, `@JsonProperty("public_url_path") publicUrlPath`.
- `GroupCollaboratorResponse`: `id, role`, `@JsonProperty("invited_at") invitedAt`, `user: UserResponseDto` (reuse existing; or a slimmer `{ id, displayName, email, avatarUrl }`).
- `RestoreResultResponse`: `restored:true`, `type` (`NOTE|GROUP`), `id`.
- `FavoritesResponse`: `List<GroupResponse> groups, List<NoteSummaryResponse> notes`.

---

## 10. Edge cases & rules checklist

- **Ownership everywhere:** every group/note operation must verify the resource belongs to `currentUser` (group → via `workspace.owner`; note → `owner`). On mismatch throw `GROUP_NOT_FOUND`/`NOTE_NOT_FOUND` (don't leak existence) — *not* `FORBIDDEN`, unless you specifically want to.
- **Root group protection:** the auto-created root group can be renamed but **not** moved, archived, deleted, or have a parent set. `ROOT_GROUP_PROTECTED`.
- **Same-workspace constraint:** moving/duplicating a group keeps it in its original workspace. Cross-workspace ops → `BAD_REQUEST`.
- **Circular reference:** `move` of a group rejects target == self or any descendant → `CIRCULAR_GROUP_REFERENCE`.
- **Soft-delete invisibility:** after `DELETE`, a note/group must not appear in tree, children, listings, search, breadcrumb of others. Only `/bin` (via native queries) sees it.
- **Restore after group deleted:** restoring a note whose original group is soft-deleted/gone → reattach to the user's root group.
- **Archive ≠ delete:** archived notes/groups have no expiry, stay searchable in the `?status=ARCHIVED` listing, and are excluded from normal (`ACTIVE`) listings.
- **Lock/secure gating** applies to *content* endpoints only, never to metadata/tree. Creating/moving a note into a locked-without-token group is blocked. The owner removing a lock still must supply the current password.
- **Rate-limit** keyed per (entityType, entityId, user). 5 fails → 60s block. Successful unlock clears it. In-memory; resets on restart (acceptable, document it).
- **Public link** can't be enabled on a locked/secure item. Regenerating invalidates the old token immediately. `visibility` flips PUBLIC↔PRIVATE accordingly; sharing-with-person sets SHARED.
- **Autosave PATCH** must be cheap and idempotent — no activity-log spam, partial updates only, never resets unspecified fields.
- **Duplicates** are always created unlocked, non-secure, `visibility=PRIVATE`, `isFavorite=false`, no `shareToken`, owner = currentUser. Append at end (`maxSortOrder+1`). Name suffix `" (copy)"`.
- **Cascade on permanent delete** (and scheduler): collaborators, group-collaborators (for groups), reminders, tags, media, activity logs, then the row. Wrap in `@Transactional`.
- **`ddl-auto: update`** will add the new columns/tables; it will **not** drop or rename anything. No migration scripts needed. Don't change `ddl-auto`.
- **Don't break Auth:** `AuthServiceImpl.register` change must stay inside the existing `@Transactional` and not alter the response shape.
- **Validation messages** in DTOs are user-facing — write them clearly (the global handler surfaces them in `fieldErrors`).

---

## 11. Suggested file/class inventory (new + modified)

**Modified:** `entity/Group`, `entity/Note`, `entity/Collaborator` (→ public), `entity/NoteTag`/`NoteMedia` (→ public, if wired), `exception/ErrorCode`, `config/security/SecurityConfig`, `security/JwtAuthenticationFilter`, `service/impl/AuthServiceImpl`, `repo/*` (all → `extends JpaRepository`), `util/JwtUtil` (add unlock-token methods), `application.yml` (add `jwt.unlock-token-expiry`), `NotlyServerApplication` (add `@EnableScheduling`).

**New entities:** `entity/GroupCollaborator`.
**New repos:** `repo/GroupCollaboratorRepo`.
**New services:** `service/WorkspaceService(+Impl)`, `service/GroupService(+Impl)`, `service/NoteService(+Impl)`, `service/BinService(+Impl)`, `service/ActivityLogService(+Impl)` (flesh out the stub), `service/UnlockTokenService(+Impl)` (or fold into a util), `service/LockAttemptService(+Impl)`, `service/GroupShareService(+Impl)` (or keep group sharing inside `GroupService`).
**New controllers:** `controller/WorkspaceController`, `controller/GroupController`, `controller/NoteController`, `controller/BinController`.
**New mappers:** `mapper/GroupMapper`, `mapper/NoteMapper` (MapStruct, `componentModel="spring"`).
**New scheduler:** `scheduler/BinPurgeScheduler`.
**New DTOs:** everything in §9 (under `dto/request` / `dto/response`).

---

## 12. Definition of done (manual test script with Postman)

1. `POST /auth/register` → 200; DB has a `workspaces` row + a root `groups` row for the new user.
2. `GET /workspaces` → the workspace; `GET /groups/tree` → `[ { name:"Workspace", children:[] } ]`.
3. `POST /groups` (parent = root) ×2, nest one under the other → `GET /groups/tree` shows the nesting; `GET /groups/{child}/breadcrumb` → `Workspace / A / B`.
4. `POST /notes` into B → `GET /notes?group_id=B` lists it; `PATCH /notes/{id}` title+content → `GET /notes/{id}` reflects it.
5. `POST /notes/{id}/move` to A → listings update. `POST /groups/{B}/move` under itself's child → `400 GRP_002`.
6. `POST /notes/{id}/duplicate` / `/copy` → new note(s) with `" (copy)"`, unlocked, private.
7. `POST /notes/{id}/archive` → gone from group listing, present in `?status=ARCHIVED`; `/unarchive` → back.
8. `DELETE /notes/{id}` → `GET /bin` shows it (`days_left≈30`); `POST /bin/{binId}/restore` → back in its group. `DELETE /bin/{binId}` on a fresh-deleted note → permanently gone (verify no `notes` row).
9. `DELETE /groups/{A}` (subtree with B + note) → one GROUP bin item; restore → whole subtree returns; or permanent-delete → all gone, no orphan `notes`/`collaborators`/`reminders`.
10. `POST /notes/{id}/lock {password}` → `GET /notes/{id}` → `403 LOCK_005`; `POST /unlock {wrong}` ×5 → `429 LOCK_004`; after 60s `POST /unlock {correct}` → `unlock_token`; `GET /notes/{id}` with `X-Unlock-Token` → `200` + content. `DELETE /notes/{id}/lock {correct}` → unlocked.
11. `POST /groups {is_secure:true,password}` → secure group; `POST /notes {group_id:secure}` (with the group's unlock token) → created; `GET /notes/{id}` without token → `403`; with the **group's** token → `200`.
12. `POST /notes/{id}/public-link` → `GET /notes/public/{token}` **without auth** → `200 PublicNoteResponse`; `DELETE /notes/{id}/public-link` → `GET /notes/public/{token}` → `404 SHR_001`.
13. `POST /groups/{id}/collaborators {email of another registered user, role:VIEWER}` → `201`; unknown email → `404 SHR_002`; own email → `400 SHR_003`; duplicate → `409 SHR_004`; `GET /groups/{id}/collaborators` lists it; `DELETE` removes it.
14. `POST /notes/{id}/favorite` → `is_favorite` toggles; `GET /favorites` includes it.
15. Manually set a `bin_items.restore_deadline` to the past, run the scheduler (or temporarily set the cron to every minute) → the item and its entity disappear.

---

*End of plan. Implement Phase 0 → 7 in order. When a decision is ambiguous, prefer the simplest option that matches the existing Auth-feature patterns, and leave a `// TODO:` comment rather than expanding scope.*
