# Notes API Documentation

> Base URL: `http://localhost:8080/api/v1`
> Auth: Bearer JWT token in `Authorization` header

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Note (Current State)                     │
│  - title, content_json (JSONB), content_hash (SHA-256)      │
│  - version_number, lock_version (@Version)                  │
│  - updated_at, last_autosave_at                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ snapshots on change
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  NoteVersion (Immutable Snapshots)           │
│  - note_id FK, version_number, title, content_json (JSONB)  │
│  - content_hash, created_by, change_summary, created_at     │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### notes table (enhanced)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR(500) | Note title |
| `content` | TEXT | Plain text content (backward compat) |
| `content_json` | JSONB | Rich editor content (Tiptap/ProseMirror) |
| `content_hash` | VARCHAR(64) | SHA-256 hash for deduplication |
| `version_number` | BIGINT | Current version counter |
| `lock_version` | BIGINT | Optimistic locking (@Version) |
| `last_autosave_at` | TIMESTAMP | Last autosave timestamp |
| `status` | VARCHAR(20) | ACTIVE / ARCHIVED / DELETED |
| `deleted_at` | TIMESTAMP | Soft delete marker |
| `updated_at` | TIMESTAMP | Auto-updated by @UpdateTimestamp |

### note_versions table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `note_id` | UUID | FK → notes |
| `version_number` | BIGINT | Snapshot version number |
| `title` | VARCHAR(500) | Title at snapshot time |
| `content_json` | JSONB | Content snapshot |
| `content_hash` | VARCHAR(64) | Hash for integrity |
| `created_by` | UUID | FK → users |
| `change_summary` | VARCHAR(255) | "autosave", "manual", "restore" |
| `created_at` | TIMESTAMP | Snapshot timestamp |

### Indexes

```sql
CREATE INDEX idx_nv_note_id ON note_versions(note_id);
CREATE INDEX idx_nv_note_ver ON note_versions(note_id, version_number DESC);
CREATE INDEX idx_nv_note_hash ON note_versions(note_id, content_hash);
```

---

## 1. Create Note

Creates a new note in the specified group. Defaults to "Untitled" if no title provided.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes",
    "content": "Initial content"
  }'
```

### Request Body

```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Meeting Notes",
  "content": "Initial content"
}
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": "550e8400-e29b-41d4-a716-446655440002",
  "owner_name": "John Doe",
  "title": "Meeting Notes",
  "content": "Initial content",
  "content_json": null,
  "version_number": 1,
  "content_hash": null,
  "status": "ACTIVE",
  "visibility": "PRIVATE",
  "is_locked": false,
  "is_favorite": false,
  "sort_order": 0,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### Response (403 - Locked Group)

```json
{
  "code": "LOCK_005",
  "status": 403,
  "message": "Cannot create note in a locked/secure group. Unlock it first."
}
```

---

## 2. Get Note by ID

Returns full note details. Requires unlock token if note or group is locked.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-Unlock-Token: unlock-token-if-locked"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": "550e8400-e29b-41d4-a716-446655440002",
  "owner_name": "John Doe",
  "title": "Meeting Notes",
  "content": "Initial content",
  "content_json": "{\"type\":\"doc\",\"content\":[]}",
  "version_number": 5,
  "content_hash": "a3f5c2...",
  "status": "ACTIVE",
  "visibility": "PRIVATE",
  "is_locked": false,
  "is_favorite": false,
  "sort_order": 0,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-20T14:22:00"
}
```

### Response (403 - Locked)

```json
{
  "code": "LOCK_005",
  "status": 403,
  "message": "This note is locked. Provide a valid unlock token."
}
```

---

## 3. List Notes

Returns active notes as summaries (without full content). Supports filtering by group, status, or favorites.

### Request

```bash
# By group
curl -X GET "http://localhost:8080/api/v1/notes?group_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# By status
curl -X GET "http://localhost:8080/api/v1/notes?status=ARCHIVED" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Favorites only
curl -X GET "http://localhost:8080/api/v1/notes?favorite=true" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "550e8400-e29b-41d4-a716-446655440002",
    "owner_name": "John Doe",
    "title": "Meeting Notes",
    "status": "ACTIVE",
    "visibility": "PRIVATE",
    "is_locked": false,
    "is_favorite": false,
    "sort_order": 0,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-20T14:22:00"
  }
]
```

---

## 4. Update Note

Partial update. Only provided fields are updated. For editor autosave, use `/autosave` endpoint instead.

### Request

```bash
curl -X PATCH http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Meeting Notes",
    "content": "Updated content"
  }'
```

### Request Body

```json
{
  "title": "Updated Meeting Notes",
  "content": "Updated content"
}
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Updated Meeting Notes",
  "content": "Updated content",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 5. Autosave Note

Efficient autosave for editor content. Creates a snapshot **only if content changed**. Supports optimistic concurrency.

### Request

```bash
curl -X PATCH http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/autosave \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting Notes",
    "contentJson": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Hello\"}]}]}",
    "clientVersion": 5
  }'
```

### Request Body

```json
{
  "title": "Meeting Notes",
  "contentJson": "{\"type\":\"doc\",\"content\":[]}",
  "clientVersion": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Note title |
| `contentJson` | string | **Yes** | Tiptap/ProseMirror JSON |
| `clientVersion` | number | No | Optimistic lock version from last fetch |

### Behavior

1. Computes SHA-256 hash of `contentJson`
2. Compares with current `note.content_hash`
3. If hash matches → returns 200 with current note (**zero DB writes**)
4. If hash differs → saves snapshot, updates note, increments `version_number`
5. If `clientVersion` ≠ `lock_version` → returns **409 Conflict**

### Response (200 - saved)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Meeting Notes",
  "content_json": "{\"type\":\"doc\",\"content\":[]}",
  "version_number": 6,
  "content_hash": "a3f5c2...",
  "last_autosave_at": "2024-01-21T10:30:00",
  "updated_at": "2024-01-21T10:30:00"
}
```

### Response (200 - skipped, no change)

Same as above but `version_number` unchanged, `updated_at` unchanged.

### Response (409 - concurrent modification)

```json
{
  "code": "CON_001",
  "status": 409,
  "message": "Concurrent modification detected. Please refresh and try again."
}
```

---

## 6. Get Note Version History

Paginated snapshot history for a note.

### Request

```bash
curl -X GET "http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/versions?page=0&size=20" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "version_number": 5,
      "title": "Meeting Notes",
      "content_json": "{\"type\":\"doc\"}",
      "content_hash": "a3f5c2...",
      "created_by": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "johndoe",
        "display_name": "John Doe"
      },
      "change_summary": "autosave",
      "created_at": "2024-01-21T10:30:00"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "version_number": 4,
      "title": "Meeting Notes",
      "content_json": "{\"type\":\"doc\"}",
      "content_hash": "b7e1d9...",
      "created_by": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "johndoe",
        "display_name": "John Doe"
      },
      "change_summary": "autosave",
      "created_at": "2024-01-21T10:25:00"
    }
  ],
  "total_elements": 15,
  "total_pages": 1,
  "size": 20,
  "number": 0
}
```

---

## 7. Restore Note Version

Restores a note to a previous snapshot. Current state is saved as a snapshot before restore.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/versions/550e8400-e29b-41d4-a716-446655440003/restore \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Behavior

1. Validates version belongs to the note
2. Saves current state as snapshot with `changeSummary = "restore-pre"`
3. Copies version data to note
4. Increments `version_number`
5. Saves restore marker snapshot with `changeSummary = "restore-from-v{N}"`

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Meeting Notes (old)",
  "content_json": "{...restored content...}",
  "version_number": 16,
  "content_hash": "a3f5c2...",
  "updated_at": "2024-01-21T11:00:00"
}
```

---

## 8. Move Note

Moves a note to a different group.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/move \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_group_id": "550e8400-e29b-41d4-a716-446655440005"
  }'
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "group_id": "550e8400-e29b-41d4-a716-446655440005",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 9. Duplicate Note

Creates a copy of a note in the same group.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/duplicate \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Meeting Notes (Copy)",
  "content": "Initial content",
  "sort_order": 1,
  "created_at": "2024-01-21T09:15:00"
}
```

---

## 10. Copy Note to Folder

Copies a note to a different group. Original note is kept.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/copy \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_group_id": "550e8400-e29b-41d4-a716-446655440005"
  }'
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440007",
  "group_id": "550e8400-e29b-41d4-a716-446655440005",
  "title": "Meeting Notes (Copy)",
  "content": "Initial content",
  "created_at": "2024-01-21T09:15:00"
}
```

---

## 11. Archive Note

Archives a note. Archived notes are excluded from normal listings.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/archive \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "ARCHIVED",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 12. Unarchive Note

Restores an archived note to active status.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/unarchive \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "ACTIVE",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 13. Delete Note (Soft Delete)

Soft-deletes a note. Moves to bin for 30-day restore window.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

---

## 14. Create Public Link

Generates a public shareable link for the note.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/public-link \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "share_token": "abc123-def456-ghi789",
  "public_url_path": "/api/v1/notes/public/abc123-def456-ghi789"
}
```

### Response (403 - Locked)

```json
{
  "code": "LOCK_005",
  "status": 403,
  "message": "Cannot share a locked/secure note publicly"
}
```

---

## 15. Regenerate Public Link

Generates a new public link, invalidating the old one.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/public-link/regenerate \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "share_token": "xyz789-abc123-def456",
  "public_url_path": "/api/v1/notes/public/xyz789-abc123-def456"
}
```

---

## 16. Revoke Public Link

Removes the public link, making the note private again.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/public-link \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

---

## 17. Toggle Favorite

Toggles the favorite status of a note.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/notes/550e8400-e29b-41d4-a716-446655440001/favorite \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "is_favorite": true,
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 18. Get Public Note (No Auth)

Read-only access to a publicly shared note via share token.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/notes/public/abc123-def456-ghi789
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Meeting Notes",
  "content": "Note content...",
  "owner_name": "John Doe",
  "created_at": "2024-01-15T10:30:00"
}
```

### Response (404 - Invalid Token)

```json
{
  "code": "SHR_001",
  "status": 404,
  "message": "Invalid or revoked share link"
}
```

---

## Endpoint Summary

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/notes` | Bearer | Create note |
| 2 | GET | `/notes/{id}` | Bearer | Get note (supports X-Unlock-Token) |
| 3 | GET | `/notes` | Bearer | List notes (filter by group/status/favorite) |
| 4 | PATCH | `/notes/{id}` | Bearer | Update note (partial) |
| 5 | PATCH | `/notes/{id}/autosave` | Bearer | Autosave with deduplication |
| 6 | GET | `/notes/{id}/versions` | Bearer | Get version history (paginated) |
| 7 | POST | `/notes/{id}/versions/{versionId}/restore` | Bearer | Restore snapshot |
| 8 | POST | `/notes/{id}/move` | Bearer | Move to different group |
| 9 | POST | `/notes/{id}/duplicate` | Bearer | Duplicate in same group |
| 10 | POST | `/notes/{id}/copy` | Bearer | Copy to different group |
| 11 | POST | `/notes/{id}/archive` | Bearer | Archive note |
| 12 | POST | `/notes/{id}/unarchive` | Bearer | Unarchive note |
| 13 | DELETE | `/notes/{id}` | Bearer | Soft delete |
| 14 | POST | `/notes/{id}/public-link` | Bearer | Create public link |
| 15 | POST | `/notes/{id}/public-link/regenerate` | Bearer | Regenerate link |
| 16 | DELETE | `/notes/{id}/public-link` | Bearer | Revoke link |
| 17 | POST | `/notes/{id}/favorite` | Bearer | Toggle favorite |
| 18 | GET | `/notes/public/{token}` | No | Read public note |

---

## Key Design Decisions

### Snapshot-Based Versioning
- Every meaningful change creates an **immutable snapshot**
- Snapshots contain the **full state** (not diffs)
- Future: can add diff-based optimization on top without breaking existing snapshots

### Content Hash Deduplication
- SHA-256 hash computed on every autosave
- If hash equals current hash → skip save entirely (**zero DB writes**)
- Protects against duplicate snapshots from debounced autosave events

### Optimistic Concurrency
- `@Version` annotation on `lock_version` field
- Client sends `clientVersion` with autosave
- If `clientVersion` ≠ server's `lock_version` → **409 Conflict**

### JSONB Content Storage
- PostgreSQL JSONB for rich editor content (Tiptap/ProseMirror)
- Indexed for fast queries
- Compression-ready

---

## Performance Characteristics

| Operation | DB Writes | Notes |
|-----------|-----------|-------|
| Autosave (no change) | **0** | Hash comparison only |
| Autosave (changed) | 2 | 1 snapshot INSERT + 1 note UPDATE |
| Get versions | 0 | Paginated, indexed |
| Restore | 3 | 2 snapshots + 1 update |
| Update (PATCH) | 1 | Direct note update |

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `CON_001` | 409 | Concurrent modification |
| `NOTE_001` | 404 | Note not found |
| `LOCK_005` | 403 | Note/group is locked |
| `VAL_001` | 400 | Validation failed |
| `SHR_001` | 404 | Invalid share token |
| `GRP_001` | 404 | Group not found |