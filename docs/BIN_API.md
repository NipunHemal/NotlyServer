# Bin API Documentation

> Base URL: `http://localhost:8080/api/v1`
> Auth: Bearer JWT token in `Authorization` header

---

## 1. List Bin Items

Returns all soft-deleted notes and groups in the authenticated user's recycle bin.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/bin \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "entity_type": "NOTE",
    "entity_id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Meeting Notes",
    "deleted_at": "2024-01-15T10:30:00",
    "restore_deadline": "2024-02-14T10:30:00",
    "days_left": 25,
    "original_group_id": "550e8400-e29b-41d4-a716-446655440002"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "entity_type": "GROUP",
    "entity_id": "550e8400-e29b-41d4-a716-446655440004",
    "title": "Work Projects",
    "deleted_at": "2024-01-10T08:00:00",
    "restore_deadline": "2024-02-09T08:00:00",
    "days_left": 20,
    "original_group_id": null
  }
]
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Bin item ID (use this for restore/delete) |
| `entity_type` | string | `NOTE` or `GROUP` |
| `entity_id` | UUID | Original entity ID |
| `title` | string | Title of the deleted note or name of the deleted group |
| `deleted_at` | string | When the item was deleted (ISO 8601) |
| `restore_deadline` | string | Last day to restore (30 days after deletion) |
| `days_left` | number | Days remaining until permanent deletion |
| `original_group_id` | UUID | For notes: the group it belonged to. For groups: `null` |

### Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized. Please login."
}
```

---

## 2. Restore Bin Item

Restores a soft-deleted note or group from the bin. Fails if the 30-day restore window has expired.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/bin/550e8400-e29b-41d4-a716-446655440000/restore \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "restored": true,
  "type": "NOTE",
  "id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Response (404 Not Found)

```json
{
  "code": "BIN_ITEM_NOT_FOUND",
  "status": 404,
  "message": "Bin item not found",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

### Response (410 Gone - Restore Window Expired)

```json
{
  "code": "RESTORE_WINDOW_EXPIRED",
  "status": 410,
  "message": "Restore window has expired (30 days). Item cannot be restored.",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 3. Permanently Delete Bin Item

Permanently deletes a single note or group from the bin. This action **cannot be undone**.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/bin/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

### Response (404 Not Found)

```json
{
  "code": "BIN_ITEM_NOT_FOUND",
  "status": 404,
  "message": "Bin item not found",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 4. Empty Bin

Permanently deletes **all** items in the user's bin. This action **cannot be undone**.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/bin \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

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
| GET | `/api/v1/bin` | Bearer | List all bin items |
| POST | `/api/v1/bin/{id}/restore` | Bearer | Restore a bin item |
| DELETE | `/api/v1/bin/{id}` | Bearer | Permanently delete a bin item |
| DELETE | `/api/v1/bin` | Bearer | Empty entire bin |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 204 | No Content (delete success) |
| 401 | Unauthorized |
| 404 | Bin item not found |
| 410 | Restore window expired |
| 500 | Internal server error |

## Important Notes

- Items in the bin are kept for **30 days** after deletion
- After 30 days, items are **automatically purged** by a scheduled job
- Restoring a group also restores all notes that were inside it at the time of deletion
- The `id` in the bin endpoint URL is the **bin item ID**, not the original entity ID
- Use `days_left` to show a warning to users about how much time remains