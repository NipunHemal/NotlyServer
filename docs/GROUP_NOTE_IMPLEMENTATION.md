# Notly Server — Group, Note & Workspace Implementation Documentation

> **Generated:** May 12, 2026
> **Scope:** Complete Group/Folder, Note, Workspace, Bin, Sharing, Lock/Unlock, and Favorites features

---

## 1. Architecture Overview

### Layer Structure
```
Controller → Service Interface → ServiceImpl → Repository → Database
```

### Key Design Principles
- **SOLID Compliance:** Single Responsibility, Dependency Inversion, Interface Segregation
- **Clean Code:** Thin controllers, business logic in services, no try/catch in controllers
- **Exception Handling:** Single `NotlyException` with `ErrorCode` enum (per GUIDELINE.md)
- **Transaction Management:** `@Transactional` on mutating methods, `@Transactional(readOnly = true)` on reads
- **Soft Delete:** `@SQLRestriction` filters deleted rows; native queries bypass for Bin operations
- **Activity Logging:** Best-effort logging (swallows errors, never breaks operations)

---

## 2. Entity Changes

### 2.1 Group Entity (Modified)
**New Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `visibility` | Enum (PRIVATE/SHARED/PUBLIC) | Group visibility level |
| `isSecure` | boolean | Vault mode flag |
| `shareToken` | String (64 chars, unique) | Public sharing token |
| `archivedAt` | LocalDateTime | Archive timestamp |
| `deletedAt` | LocalDateTime | Soft-delete timestamp |

**Annotations Added:**
- `@SQLRestriction("deleted_at IS NULL")` - Filters soft-deleted groups
- `@SQLDelete(sql = "UPDATE groups SET deleted_at = NOW() WHERE id = ?")` - Soft-delete SQL

**Methods Added:**
- `softDelete()` - Sets `deletedAt`
- `restore()` - Clears `deletedAt`

### 2.2 Note Entity (Modified)
**New Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `shareToken` | String (64 chars, unique) | Public sharing token |
| `archivedAt` | LocalDateTime | Archive timestamp |
| `sortOrder` | int | Ordering within group (default 0) |

### 2.3 GroupCollaborator Entity (New)
**Purpose:** Group sharing with users by email

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `group` | Group (LAZY) | Associated group |
| `user` | User (LAZY) | Collaborator user |
| `role` | Enum (OWNER/EDITOR/VIEWER) | Access role |
| `invitedAt` | LocalDateTime | Invitation timestamp |
| `acceptedAt` | LocalDateTime | Acceptance timestamp |

**Constraints:**
- Unique: `(group_id, user_id)`
- Indexes on `group_id` and `user_id`

### 2.4 Visibility Changes
- `Collaborator` class → `public` (was package-private)
- `NoteTag` class → `public` (was package-private)
- `NoteMedia` class → `public` (was package-private)

---

## 3. Repository Layer

### 3.1 All Repositories Extended
All repository stubs now extend `JpaRepository<Entity, UUID>` with custom query methods.

### 3.2 Key Repository Methods

#### GroupRepo
| Method | Purpose |
|--------|---------|
| `findByWorkspaceIdAndParentIsNullOrderBySortOrderAsc` | Root groups of workspace |
| `findByParentIdOrderBySortOrderAsc` | Direct children |
| `findByIdAndWorkspaceOwnerId` | Ownership-scoped fetch |
| `findByWorkspaceOwnerIdOrderBySortOrderAsc` | All user's groups for tree building |
| `findByShareTokenAndVisibility` | Public group lookup |
| `maxSortOrderAmongSiblings` | JPQL for append positioning |
| `findRawById` (native) | Bypass @SQLRestriction for Bin |
| `restoreRaw` (native) | Restore soft-deleted group |
| `hardDelete` (native) | Permanent deletion |

#### NoteRepo
| Method | Purpose |
|--------|---------|
| `findByGroupIdOrderBySortOrderAscCreatedAtAsc` | Notes in group (active only) |
| `findByIdAndOwnerId` | Ownership-scoped fetch |
| `findByOwnerIdAndStatus` | Filter by status (ARCHIVED, etc.) |
| `findByShareTokenAndVisibility` | Public note lookup |
| `maxSortOrderInGroup` | JPQL for append positioning |
| `findRawById` (native) | Bypass @SQLRestriction for Bin |
| `findDeletedByOwner` (native) | List soft-deleted notes |
| `restoreRaw` (native) | Restore soft-deleted note |
| `hardDelete` (native) | Permanent deletion |

#### Other Repos
| Repository | Key Methods |
|------------|-------------|
| `WorkspaceRepo` | `findFirstByOwnerIdOrderByCreatedAtAsc`, `findByOwnerId` |
| `BinItemRepo` | `findByOwnerIdOrderByDeletedAtDesc`, `findByRestoreDeadlineBefore` |
| `GroupCollaboratorRepo` | `findByGroupId`, `findByGroupIdAndUserId`, `existsByGroupIdAndUserId` |
| `CollaboratorRepo` | `deleteByNoteId` (cascade) |
| `ReminderRepo` | `deleteByNoteId` (cascade) |
| `NoteTagRepo` | `deleteByNoteId` (cascade) |
| `NoteMediaRepo` | `deleteByNoteId` (cascade) |
| `ActivityLogRepo` | `deleteByEntityTypeAndEntityId` (cascade) |

---

## 4. Error Codes Added

| Code | HTTP Status | Message |
|------|-------------|---------|
| `WS_001` | 404 | Workspace not found |
| `GRP_001` | 404 | Group not found |
| `GRP_002` | 400 | Circular group reference |
| `GRP_003` | 400 | Root group protected |
| `NOTE_001` | 404 | Note not found |
| `LOCK_001` | 401 | Incorrect password |
| `LOCK_002` | 400 | Item not locked |
| `LOCK_003` | 409 | Item already locked |
| `LOCK_004` | 429 | Too many failed attempts |
| `LOCK_005` | 403 | Item locked |
| `LOCK_006` | 403 | Invalid unlock token |
| `SHR_001` | 404 | Invalid share token |
| `SHR_002` | 404 | Share target not found |
| `SHR_003` | 400 | Cannot share with self |
| `SHR_004` | 409 | Already shared |
| `SHR_005` | 404 | Collaborator not found |
| `BIN_001` | 404 | Bin item not found |
| `BIN_002` | 410 | Restore window expired |

---

## 5. Service Layer

### 5.1 WorkspaceService
| Method | Description |
|--------|-------------|
| `getOrCreateDefaultWorkspace(User)` | Lazy-creates workspace + root group |
| `getWorkspaceByIdAndOwner(UUID, User)` | Ownership-scoped fetch |
| `getWorkspacesByOwner(User)` | List all user workspaces |
| `getWorkspaceResponseById(UUID, User)` | Get workspace as DTO |

### 5.2 GroupService
| Method | Description |
|--------|-------------|
| `createGroup(CreateGroupRequest, User)` | Create group with optional lock/secure |
| `getGroupById(UUID, User)` | Get group metadata |
| `getGroupChildren(UUID, User, String)` | Get children + notes (unlock-gated) |
| `getGroupTree(User, UUID)` | Build full nested tree in memory |
| `getBreadcrumb(UUID, User)` | Walk parent chain to root |
| `updateGroup(UUID, UpdateGroupRequest, User)` | Rename group |
| `getGroupStats(UUID, User)` | Note/subgroup counts |
| `moveGroup(UUID, MoveGroupRequest, User)` | Move with circular-reference check |
| `reorderGroup(UUID, Integer, User)` | Change sort order |
| `duplicateGroup(UUID, DuplicateGroupRequest, User)` | Deep copy (max 50 levels) |
| `archiveGroup(UUID, User)` | Recursive archive |
| `unarchiveGroup(UUID, User)` | Recursive unarchive |
| `softDeleteGroup(UUID, User)` | Subtree soft-delete → Bin |
| `lockGroup(UUID, LockRequest, User)` | Password-lock group |
| `unlockGroup(UUID, UnlockRequest, User)` | Verify password → unlock token |
| `changeGroupLockPassword(UUID, ChangeLockRequest, User)` | Change lock password |
| `removeGroupLock(UUID, UnlockRequest, User)` | Remove lock entirely |
| `createPublicLink(UUID, User)` | Generate share token |
| `regeneratePublicLink(UUID, User)` | New token, invalidate old |
| `revokePublicLink(UUID, User)` | Remove public access |
| `shareGroupWithEmail(UUID, ShareGroupRequest, User)` | Email-based sharing |
| `getGroupCollaborators(UUID, User)` | List collaborators |
| `updateCollaboratorRole(UUID, UUID, UpdateCollaboratorRoleRequest, User)` | Change role |
| `removeCollaborator(UUID, UUID, User)` | Remove collaborator |
| `toggleFavorite(UUID, User)` | Toggle favorite status |
| `getFavoriteGroups(User)` | List favorited groups |

### 5.3 NoteService
| Method | Description |
|--------|-------------|
| `createNote(CreateNoteRequest, User)` | Create note (defaults to "Untitled") |
| `getNoteById(UUID, User, String)` | Get note (unlock-gated) |
| `getNotesByGroupId(UUID, User)` | List active notes in group |
| `getNotesByStatus(User, NoteStatus)` | Filter by status |
| `getNotesByFavorite(User)` | List favorited notes |
| `updateNote(UUID, UpdateNoteRequest, User)` | Partial update (autosave) |
| `moveNote(UUID, MoveNoteRequest, User)` | Move to different group |
| `duplicateNote(UUID, User)` | Copy in same group |
| `copyNote(UUID, CopyNoteRequest, User)` | Copy to different group |
| `archiveNote(UUID, User)` | Archive note |
| `unarchiveNote(UUID, User)` | Unarchive note |
| `softDeleteNote(UUID, User)` | Soft-delete → Bin |
| `lockNote(UUID, LockRequest, User)` | Password-lock note |
| `unlockNote(UUID, UnlockRequest, User)` | Verify password → unlock token |
| `changeNoteLockPassword(UUID, ChangeLockRequest, User)` | Change lock password |
| `removeNoteLock(UUID, UnlockRequest, User)` | Remove lock entirely |
| `createNotePublicLink(UUID, User)` | Generate share token |
| `regenerateNotePublicLink(UUID, User)` | New token, invalidate old |
| `revokeNotePublicLink(UUID, User)` | Remove public access |
| `getPublicGroupByToken(String)` | Public group read (no auth) |
| `getPublicNoteByToken(String)` | Public note read (no auth) |
| `toggleFavorite(UUID, User)` | Toggle favorite status |

### 5.4 BinService
| Method | Description |
|--------|-------------|
| `getBinItems(User)` | List all bin items with titles |
| `restoreBinItem(UUID, User)` | Restore from bin (checks 30-day window) |
| `permanentDeleteBinItem(UUID, User)` | Hard delete with cascade |
| `emptyBin(User)` | Delete all bin items |

### 5.5 LockAttemptService (Rate Limiter)
**In-memory ConcurrentHashMap-based rate limiter:**
- **Key format:** `ENTITY_TYPE:entityId:userId`
- **Threshold:** 5 failed attempts → 60-second block
- **Reset:** On successful unlock or server restart
- **Thread-safe:** Uses `ConcurrentHashMap`

### 5.6 ActivityLogService
**Best-effort logging:**
- `log(userId, entityType, entityId, action, metadata)` - Swallows errors
- `deleteForEntity(entityType, entityId)` - Cascade cleanup

---

## 6. Controller Layer

### 6.1 WorkspaceController
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/workspaces` | ✓ | List user's workspaces |
| `GET` | `/workspaces/{id}` | ✓ | Get workspace by ID |

### 6.2 GroupController
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/groups` | ✓ | Create group |
| `GET` | `/groups/{id}` | ✓ | Get group metadata |
| `GET` | `/groups/{id}/children` | ✓ | Get children + notes |
| `GET` | `/groups/tree` | ✓ | Get full tree |
| `GET` | `/groups/{id}/breadcrumb` | ✓ | Get breadcrumb path |
| `PATCH` | `/groups/{id}` | ✓ | Rename group |
| `GET` | `/groups/{id}/stats` | ✓ | Get statistics |
| `POST` | `/groups/{id}/move` | ✓ | Move group |
| `POST` | `/groups/{id}/reorder` | ✓ | Reorder among siblings |
| `POST` | `/groups/{id}/duplicate` | ✓ | Deep duplicate |
| `POST` | `/groups/{id}/archive` | ✓ | Archive recursively |
| `POST` | `/groups/{id}/unarchive` | ✓ | Unarchive recursively |
| `DELETE` | `/groups/{id}` | ✓ | Soft-delete → Bin |
| `POST` | `/groups/{id}/lock` | ✓ | Lock with password |
| `POST` | `/groups/{id}/unlock` | ✓ | Unlock → token |
| `PUT` | `/groups/{id}/lock` | ✓ | Change password |
| `DELETE` | `/groups/{id}/lock` | ✓ | Remove lock |
| `POST` | `/groups/{id}/public-link` | ✓ | Create public link |
| `POST` | `/groups/{id}/public-link/regenerate` | ✓ | Regenerate link |
| `DELETE` | `/groups/{id}/public-link` | ✓ | Revoke link |
| `POST` | `/groups/{id}/collaborators` | ✓ | Share with email |
| `GET` | `/groups/{id}/collaborators` | ✓ | List collaborators |
| `PUT` | `/groups/{id}/collaborators/{userId}` | ✓ | Update role |
| `DELETE` | `/groups/{id}/collaborators/{userId}` | ✓ | Remove collaborator |
| `POST` | `/groups/{id}/favorite` | ✓ | Toggle favorite |

### 6.3 NoteController
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/notes` | ✓ | Create note |
| `GET` | `/notes/{id}` | ✓ | Get note (unlock-gated) |
| `GET` | `/notes?group_id=` | ✓ | List by group |
| `GET` | `/notes?status=ARCHIVED` | ✓ | List archived |
| `GET` | `/notes?favorite=true` | ✓ | List favorited |
| `PATCH` | `/notes/{id}` | ✓ | Autosave (partial) |
| `POST` | `/notes/{id}/move` | ✓ | Move to group |
| `POST` | `/notes/{id}/duplicate` | ✓ | Duplicate in place |
| `POST` | `/notes/{id}/copy` | ✓ | Copy to folder |
| `POST` | `/notes/{id}/archive` | ✓ | Archive note |
| `POST` | `/notes/{id}/unarchive` | ✓ | Unarchive note |
| `DELETE` | `/notes/{id}` | ✓ | Soft-delete → Bin |
| `POST` | `/notes/{id}/lock` | ✓ | Lock with password |
| `POST` | `/notes/{id}/unlock` | ✓ | Unlock → token |
| `PUT` | `/notes/{id}/lock` | ✓ | Change password |
| `DELETE` | `/notes/{id}/lock` | ✓ | Remove lock |
| `POST` | `/notes/{id}/public-link` | ✓ | Create public link |
| `POST` | `/notes/{id}/public-link/regenerate` | ✓ | Regenerate link |
| `DELETE` | `/notes/{id}/public-link` | ✓ | Revoke link |
| `POST` | `/notes/{id}/favorite` | ✓ | Toggle favorite |

### 6.4 BinController
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/bin` | ✓ | List bin items |
| `POST` | `/bin/{id}/restore` | ✓ | Restore item |
| `DELETE` | `/bin/{id}` | ✓ | Permanent delete |
| `DELETE` | `/bin` | ✓ | Empty bin |

### 6.5 FavoritesController
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/favorites` | ✓ | Get all favorites |

### 6.6 Public Controllers (No Auth)
| Controller | Method | Path | Description |
|------------|--------|------|-------------|
| `PublicNoteController` | `GET` | `/notes/public/{token}` | Read public note |
| `PublicGroupController` | `GET` | `/groups/public/{token}` | Read public group |

---

## 7. DTO Catalogue

### Request DTOs (dto/request)
| DTO | Fields |
|-----|--------|
| `CreateGroupRequest` | name, parent_id, is_secure, password |
| `UpdateGroupRequest` | name |
| `MoveGroupRequest` | target_parent_id, sort_order |
| `DuplicateGroupRequest` | target_parent_id |
| `ReorderRequest` | sort_order |
| `CreateNoteRequest` | group_id, title, content |
| `UpdateNoteRequest` | title, content |
| `MoveNoteRequest` | target_group_id, sort_order |
| `CopyNoteRequest` | target_group_id |
| `LockRequest` | password, make_secure |
| `UnlockRequest` | password |
| `ChangeLockRequest` | current_password, new_password |
| `ShareGroupRequest` | email, role |
| `UpdateCollaboratorRoleRequest` | role |

### Response DTOs (dto/response)
| DTO | Fields |
|-----|--------|
| `WorkspaceResponse` | id, name, isPublic, createdAt |
| `GroupResponse` | id, name, parent_id, workspace_id, sort_order, is_locked, is_secure, is_favorite, is_archived, visibility, createdAt, updatedAt |
| `GroupTreeNode` | id, name, is_locked, is_secure, is_favorite, is_archived, sort_order, children |
| `BreadcrumbItem` | id, name |
| `GroupStatsResponse` | directNoteCount, directSubgroupCount, totalNoteCount, lastActivityAt |
| `GroupChildrenResponse` | groups, notes |
| `NoteResponse` | id, group_id, owner_id, owner_name, title, content, status, visibility, is_locked, is_favorite, sort_order, createdAt, updatedAt |
| `NoteSummaryResponse` | id, group_id, owner_id, owner_name, title, status, visibility, is_locked, is_favorite, sort_order, createdAt, updatedAt |
| `PublicNoteResponse` | title, content, owner_name, owner_avatar_url, createdAt, updatedAt |
| `PublicGroupResponse` | name, owner_name, notes |
| `UnlockTokenResponse` | unlock_token, expires_in_seconds |
| `BinItemResponse` | id, entity_type, entity_id, title, deleted_at, restore_deadline, days_left, original_group_id |
| `ShareLinkResponse` | share_token, public_url_path |
| `GroupCollaboratorResponse` | id, role, invited_at, user |
| `RestoreResultResponse` | restored, type, id |
| `FavoritesResponse` | groups, notes |

---

## 8. Security & Authorization

### 8.1 Ownership Verification
- **Groups:** `workspace.owner.id == currentUser.id`
- **Notes:** `note.owner.id == currentUser.id`
- **Helpers:** `requireOwnedGroup()`, `requireOwnedNote()` throw `GROUP_NOT_FOUND`/`NOTE_NOT_FOUND`

### 8.2 Lock/Secure Gating
- **Metadata endpoints** (tree, breadcrumb, group info): Never gated
- **Content endpoints** (note content, children listing): Gated by lock/secure status
- **Unlock token:** Short-lived JWT (2h), passed via `X-Unlock-Token` header
- **Ancestor walking:** Note accessibility checks note lock + all ancestor group locks

### 8.3 Rate Limiting
- **Scope:** Per (entityType, entityId, userId) key
- **Threshold:** 5 failed attempts → 60-second block
- **Storage:** In-memory `ConcurrentHashMap`
- **Reset:** On successful unlock or server restart

### 8.4 Security Config Changes
| Path | Auth Rule |
|------|-----------|
| `/api/v1/notes/public/**` | permitAll |
| `/api/v1/groups/public/**` | permitAll |
| `/api/v1/groups/**` | authenticated |
| `/api/v1/notes/**` | authenticated |
| `/api/v1/workspaces/**` | authenticated |
| `/api/v1/bin/**` | authenticated |
| `/api/v1/favorites/**` | authenticated |

---

## 9. Workspace Auto-Provisioning

On user registration (`AuthServiceImpl.register`):
1. Create `User` entity
2. Create `Workspace { owner=user, name="My Workspace", isPublic=false }`
3. Create root `Group { workspace, parent=null, name="Workspace", sortOrder=0 }`
4. All within existing `@Transactional` for atomicity

**Lazy Fallback:** `getOrCreateDefaultWorkspace()` creates workspace on first access for pre-existing users.

---

## 10. Bin & 30-Day Purge

### 10.1 Soft-Delete Flow
**Note:**
1. `note.softDelete()` → sets `deletedAt`, `status=DELETED`
2. Create `BinItem { owner, entityType=NOTE, entityId, restoreDeadline=now+30d }`
3. Log `DELETED` activity

**Group:**
1. Recursive soft-delete of all descendant groups + notes
2. Create single `BinItem { entityType=GROUP, entityId=rootGroup }`
3. Log `DELETED` activity

### 10.2 Restore Flow
- Check `restoreDeadline > now` (else `BIN_RESTORE_EXPIRED`)
- **Note:** `noteRepo.restoreRaw(entityId)`; reassign to root group if original group is gone
- **Group:** Recursively restore subtree + notes; reassign parent if gone

### 10.3 Permanent Delete Flow
**Note cascade:**
```
collaborators → reminders → tags → media → activity logs → note
```

**Group cascade:**
```
descendant groups (bottom-up) → notes (with cascade) → group collaborators → activity logs → group
```

### 10.4 Purge Scheduler
- **Cron:** `0 0 3 * * *` (daily at 03:00)
- **Logic:** Find items where `restoreDeadline < now`, permanent delete each
- **Error handling:** Swallow individual failures, log warnings

---

## 11. Sharing

### 11.1 Public Links
- **Token:** UUID.randomUUID().toString()
- **Visibility:** Flips to PUBLIC
- **Locked items:** Cannot be publicly shared
- **Regenerate:** New token, old immediately invalid
- **Revoke:** Token=null, visibility=PRIVATE

### 11.2 Email Sharing
- **Target:** Must be registered user (no email infra)
- **Roles:** EDITOR or VIEWER (not OWNER)
- **Self-share:** Blocked (`CANNOT_SHARE_WITH_SELF`)
- **Duplicate:** Blocked (`ALREADY_SHARED`)
- **Visibility:** Flips to SHARED
- **Last collaborator removed:** Flips back to PRIVATE

---

## 12. Edge Cases & Rules

| Rule | Implementation |
|------|----------------|
| Root group protection | `assertNotRoot()` throws `ROOT_GROUP_PROTECTED` |
| Same-workspace constraint | Workspace ID comparison on move |
| Circular reference | `isSelfOrDescendant()` walks parent chain |
| Soft-delete invisibility | `@SQLRestriction` filters; native queries for Bin |
| Restore after group deleted | Reassign note to root group |
| Archive ≠ delete | No expiry, searchable via `?status=ARCHIVED` |
| Lock gating | Content endpoints only, never metadata |
| Autosave PATCH | Partial updates, no activity-log spam |
| Duplicates | Unlocked, non-secure, PRIVATE, no shareToken, " (copy)" suffix |
| Cascade on permanent delete | All dependents deleted in transaction |
| ddl-auto: update | Auto-migrates schema; no Flyway needed |

---

## 13. File Inventory

### Modified Files (15)
1. `entity/Group.java` - Added fields, soft-delete, visibility enum
2. `entity/Note.java` - Added shareToken, archivedAt, sortOrder
3. `entity/Collaborator.java` - Made public
4. `entity/NoteTag.java` - Made public
5. `entity/NoteMedia.java` - Made public
6. `exception/ErrorCode.java` - Added 18 error codes
7. `config/security/SecurityConfig.java` - Fixed auth rules, added paths
8. `security/JwtAuthenticationFilter.java` - Added public group whitelist
9. `service/impl/AuthServiceImpl.java` - Added workspace provisioning
10. `util/JwtUtil.java` - Added unlock token methods
11. `config/ApiConfig.java` - Added X-Unlock-Token header
12. `NotlyServerApplication.java` - Added @EnableScheduling
13. `application.yml` - Added jwt.unlock-token-expiry
14. All 11 `repo/*.java` stubs - Extended JpaRepository + methods
15. `service/GroupService.java` - Defined all methods
16. `service/NoteService.java` - Defined all methods
17. `service/WorkspaceService.java` - Defined methods
18. `service/ActivityLogService.java` - Defined methods

### New Files (60+)
- **Entities:** `GroupCollaborator.java`
- **Repos:** `GroupCollaboratorRepo.java`
- **Services (Interfaces):** `BinService.java`, `LockAttemptService.java`
- **Services (Impl):** `WorkspaceServiceImpl.java`, `GroupServiceImpl.java`, `NoteServiceImpl.java`, `BinServiceImpl.java`, `ActivityLogServiceImpl.java`, `LockAttemptServiceImpl.java`
- **Controllers:** `WorkspaceController.java`, `GroupController.java`, `NoteController.java`, `BinController.java`, `FavoritesController.java`, `PublicNoteController.java`, `PublicGroupController.java`
- **Mappers:** `GroupMapper.java`, `NoteMapper.java`
- **DTOs (Request):** `CreateGroupRequest`, `UpdateGroupRequest`, `MoveGroupRequest`, `DuplicateGroupRequest`, `ReorderRequest`, `CreateNoteRequest`, `UpdateNoteRequest`, `MoveNoteRequest`, `CopyNoteRequest`, `LockRequest`, `UnlockRequest`, `ChangeLockRequest`, `ShareGroupRequest`, `UpdateCollaboratorRoleRequest`
- **DTOs (Response):** `WorkspaceResponse`, `GroupResponse`, `GroupTreeNode`, `BreadcrumbItem`, `GroupStatsResponse`, `GroupChildrenResponse`, `NoteResponse`, `NoteSummaryResponse`, `PublicNoteResponse`, `PublicGroupResponse`, `UnlockTokenResponse`, `BinItemResponse`, `ShareLinkResponse`, `GroupCollaboratorResponse`, `RestoreResultResponse`, `FavoritesResponse`
- **Scheduler:** `BinPurgeScheduler.java`

---

## 14. Testing Checklist

### Manual Test Scenarios (Postman)

1. **Register** → DB has `workspaces` + root `groups` row
2. **GET /workspaces** → workspace returned; **GET /groups/tree** → `[ { name:"Workspace", children:[] } ]`
3. **POST /groups** ×2 (nested) → **GET /groups/tree** shows nesting; **GET /groups/{child}/breadcrumb** → `Workspace / A / B`
4. **POST /notes** into group → **GET /notes?group_id=** lists it; **PATCH /notes/{id}** → **GET /notes/{id}** reflects changes
5. **POST /notes/{id}/move** → listings update; **POST /groups/{id}/move** into descendant → `400 GRP_002`
6. **POST /notes/{id}/duplicate** → new note with `" (copy)"`, unlocked, private
7. **POST /notes/{id}/archive** → gone from group, present in `?status=ARCHIVED`; **/unarchive** → back
8. **DELETE /notes/{id}** → **GET /bin** shows it (`days_left≈30`); **POST /bin/{id}/restore** → back in group
9. **DELETE /groups/{id}** (subtree) → one GROUP bin item; restore → whole subtree returns
10. **POST /notes/{id}/lock** → **GET /notes/{id}** → `403 LOCK_005`; wrong password ×5 → `429 LOCK_004`; correct → token → `GET` with `X-Unlock-Token` → `200`
11. **POST /groups** with `is_secure:true` → secure group; note inside gated by group's token
12. **POST /notes/{id}/public-link** → **GET /notes/public/{token}** (no auth) → `200`; **DELETE** → `404 SHR_001`
13. **POST /groups/{id}/collaborators** with registered email → `201`; unknown → `404 SHR_002`; self → `400 SHR_003`
14. **POST /notes/{id}/favorite** → `is_favorite` toggles; **GET /favorites** includes it
15. Set `bin_items.restore_deadline` to past → scheduler purges item (cron every minute for testing)

---

## 15. Known Limitations

1. **Rate limiting is in-memory** - Resets on server restart (acceptable for single-instance)
2. **Email sharing requires registered users** - No email-sending infrastructure
3. **Collaborator read-access not wired** - "Shared with me" listing is a future phase
4. **No OAuth2 social login** - Enum/paths exist but config commented out
5. **No full-text search** - Out of scope
6. **No version history/snapshots** - Out of scope
7. **No real-time collaboration** - Out of scope
8. **Access tokens remain valid after logout** - Expected for stateless JWTs (15-min expiry)

---

*End of implementation documentation.*
