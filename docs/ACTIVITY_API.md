# Activity Log API

The Activity Log API provides a complete audit trail of user actions across notes, groups, workspaces, and collaborations. Every create, update, delete, share, lock, favorite, and view operation is automatically recorded and queryable.

**Base URL:** `/api/v1/activities`

**Authentication:** Bearer token required on all endpoints.

---

## Endpoints

### 1. Get My Activities

Retrieves the authenticated user's activity history, newest first.

```http
GET /api/v1/activities/me
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number (0-indexed) |
| `size` | int | 20 | Items per page |
| `sort` | string | `createdAt,desc` | Sort field and direction |

**Response — `200 OK`**

```json
{
  "content": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "entityType": "NOTE",
      "entityId": "550e8400-e29b-41d4-a716-446655440000",
      "action": "CREATED",
      "metadata": {
        "title": "Project Ideas",
        "group_id": "550e8400-e29b-41d4-a716-446655440001"
      },
      "createdAt": "2025-01-15T14:30:00"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "entityType": "GROUP",
      "entityId": "550e8400-e29b-41d4-a716-446655440001",
      "action": "SHARED",
      "metadata": {
        "shared_with": "user@example.com",
        "role": "EDITOR"
      },
      "createdAt": "2025-01-15T14:25:00"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "size": 20,
  "number": 0
}
```

---

### 2. Get My Activities by Entity Type

Filter activities to show only actions on a specific entity type.

```http
GET /api/v1/activities/me/entity/{entityType}
```

**Path Parameters:**

| Param | Value | Description |
|-------|-------|-------------|
| `entityType` | `NOTE` \| `GROUP` \| `VERSION` \| `COLLABORATOR` \| `WORKSPACE` | Entity category to filter |

**Example:**

```http
GET /api/v1/activities/me/entity/NOTE?page=0&size=10
```

**Response — `200 OK`** (same shape as "Get My Activities")

---

### 3. Get My Activities by Action

Filter activities to show only a specific action type.

```http
GET /api/v1/activities/me/action/{action}
```

**Path Parameters:**

| Param | Value | Description |
|-------|-------|-------------|
| `action` | `CREATED` \| `UPDATED` \| `DELETED` \| `RESTORED` \| `SHARED` \| `UNSHARED` \| `LOCKED` \| `UNLOCKED` \| `VERSION_CREATED` \| `VERSION_RESTORED` \| `ARCHIVED` \| `FAVORITED` \| `VIEWED` | Action to filter |

**Example:**

```http
GET /api/v1/activities/me/action/CREATED
```

**Response — `200 OK`** (same shape as "Get My Activities")

---

### 4. Get Activities for a Specific Entity

Returns the full audit trail for a single note, group, or workspace.

```http
GET /api/v1/activities/entity/{entityType}/{entityId}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `entityType` | string | `NOTE`, `GROUP`, `WORKSPACE`, etc. |
| `entityId` | UUID | The entity's unique ID |

**Example:**

```http
GET /api/v1/activities/entity/NOTE/550e8400-e29b-41d4-a716-446655440000
```

**Response — `200 OK`**

```json
[
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "entityType": "NOTE",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "action": "UPDATED",
    "metadata": { "title": "Project Ideas v2" },
    "createdAt": "2025-01-15T16:00:00"
  },
  {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "entityType": "NOTE",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "action": "CREATED",
    "metadata": { "title": "Project Ideas", "group_id": "..." },
    "createdAt": "2025-01-15T14:30:00"
  }
]
```

---

### 5. Get My Activities in Date Range

Filter activities between two ISO 8601 timestamps.

```http
GET /api/v1/activities/me/range?from={from}&to={to}
```

**Query Parameters:**

| Param | Type | Format | Description |
|-------|------|--------|-------------|
| `from` | datetime | ISO 8601 | Start of range (inclusive) |
| `to` | datetime | ISO 8601 | End of range (inclusive) |

**Example:**

```http
GET /api/v1/activities/me/range?from=2025-01-01T00:00:00&to=2025-01-31T23:59:59
```

**Response — `200 OK`** (same shape as "Get My Activities")

---

### 6. Get My Activity Statistics

Returns an aggregated summary of the user's activity.

```http
GET /api/v1/activities/me/stats
```

**Response — `200 OK`**

```json
{
  "totalActivities": 42,
  "actionCounts": {
    "CREATED": 10,
    "UPDATED": 20,
    "DELETED": 3,
    "SHARED": 5,
    "FAVORITED": 4
  },
  "topAction": "UPDATED",
  "todayCount": 5,
  "weekCount": 15
}
```

| Field | Description |
|-------|-------------|
| `totalActivities` | Total actions ever recorded for this user |
| `actionCounts` | Breakdown per action type |
| `topAction` | Most frequent action |
| `todayCount` | Actions in the last 24 hours |
| `weekCount` | Actions in the last 7 days |

---

## Tracked Actions

The system automatically logs the following actions:

| Action | Trigger |
|--------|---------|
| `CREATED` | Note / group created |
| `UPDATED` | Note / group updated, moved, renamed |
| `DELETED` | Note / group soft-deleted (moved to bin) |
| `RESTORED` | Note / group restored from bin |
| `ARCHIVED` | Note / group archived |
| `SHARED` | Note / group shared with a collaborator |
| `UNSHARED` | Collaborator removed |
| `LOCKED` | Note / group locked with password |
| `UNLOCKED` | Note / group unlocked |
| `FAVORITED` | Added to favorites |
| `VIEWED` | Note opened (read) |
| `VERSION_CREATED` | Note version snapshot saved |
| `VERSION_RESTORED` | Note restored to a previous version |

---

## Metadata

The `metadata` field is a flexible JSON object that stores context-specific data:

| Action | Metadata Keys | Example |
|--------|--------------|---------|
| `CREATED` | `title`, `group_id` | `{ "title": "Meeting Notes", "group_id": "..." }` |
| `UPDATED` | `title` | `{ "title": "Meeting Notes v2" }` |
| `SHARED` | `shared_with`, `role` | `{ "shared_with": "user@example.com", "role": "EDITOR" }` |
| `DELETED` | `title` | `{ "title": "Old Note" }` |
| `MOVED` | `old_group_id`, `new_group_id` | `{ "old_group_id": "...", "new_group_id": "..." }` |

---

## Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VAL_001` | Invalid `entityType` or `action` enum value |
| `401` | `AUTH_002` | Missing or invalid Bearer token |
| `500` | `INT_001` | Unexpected server error |

---

## Frontend Usage Tips

### Activity Feed

```javascript
// Fetch latest 20 activities
const res = await fetch('/api/v1/activities/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { content } = await res.json();
```

### Filter by Type

```javascript
// Show only note-related activities
const res = await fetch('/api/v1/activities/me/entity/NOTE', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Statistics Dashboard

```javascript
// Load stats for dashboard cards
const res = await fetch('/api/v1/activities/me/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { totalActivities, todayCount, topAction } = await res.json();
```

### Date Range Filter

```javascript
const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const to = new Date().toISOString();
const res = await fetch(`/api/v1/activities/me/range?from=${from}&to=${to}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Data Retention

Activity logs are tied to the entity lifecycle:
- When a note or group is **permanently deleted** (bin purge after 30 days), its activity logs are also deleted.
- Logs for active entities are retained indefinitely.
- Consider adding a scheduled cleanup job for very old logs if storage becomes a concern.
