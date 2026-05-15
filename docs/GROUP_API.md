# Group API Documentation

> Base URL: `http://localhost:8080/api/v1`
> Auth: Bearer JWT token in `Authorization` header

---

## 1. Create Group

Create a new group (folder). If `parent_id` is null, creates at root level.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work Projects",
    "parent_id": "550e8400-e29b-41d4-a716-446655440000",
    "is_secure": false
  }'
```

### Request Body

```json
{
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "is_secure": false,
  "password": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Group name (1-100 chars) |
| `parent_id` | UUID | No | Parent group ID (null = root) |
| `is_secure` | boolean | No | Secure vault group |
| `password` | string | No | Lock password (6-128 chars, required if is_secure=true) |

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 0,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### Response (400 Bad Request)

```json
{
  "code": "VALIDATION_FAILED",
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2024-01-21T09:15:30Z",
  "fieldErrors": {
    "name": "Group name is required"
  }
}
```

---

## 2. Get Group by ID

Retrieve group metadata.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 0,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### Response (404 Not Found)

```json
{
  "code": "NOT_FOUND",
  "status": 404,
  "message": "Group not found",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 3. Get Group Children

Get direct child groups and notes inside a group. Requires unlock token if group is locked.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/children \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-Unlock-Token: unlock-token-if-locked"
```

### Response (200 OK)

```json
{
  "groups": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Subfolder",
      "parent_id": "550e8400-e29b-41d4-a716-446655440001",
      "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
      "sort_order": 0,
      "is_locked": false,
      "is_secure": false,
      "is_favorite": false,
      "is_archived": false,
      "visibility": "PRIVATE",
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00"
    }
  ],
  "notes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "My Note",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

### Response (403 Forbidden - Locked)

```json
{
  "code": "GROUP_LOCKED",
  "status": 403,
  "message": "Group is locked. Provide unlock token.",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 4. Get Group Tree

Returns the full nested group tree for the user's workspace.

### Request

```bash
curl -X GET "http://localhost:8080/api/v1/groups/tree?workspace_id=550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Workspace",
    "is_locked": false,
    "is_secure": false,
    "is_favorite": false,
    "is_archived": false,
    "sort_order": 0,
    "children": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Work Projects",
        "is_locked": false,
        "is_secure": false,
        "is_favorite": false,
        "is_archived": false,
        "sort_order": 0,
        "children": []
      }
    ]
  }
]
```

---

## 5. Get Group Breadcrumb

Returns the path from root to the specified group.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/breadcrumb \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Workspace"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Work Projects"
  }
]
```

---

## 6. Rename Group

Update group name.

### Request

```bash
curl -X PATCH http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Work Projects"
  }'
```

### Request Body

```json
{
  "name": "Updated Work Projects"
}
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Updated Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 0,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 7. Get Group Statistics

Returns note counts and activity info for the group.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/stats \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "direct_note_count": 5,
  "direct_subgroup_count": 2,
  "total_note_count": 15,
  "last_activity_at": "2024-01-20T14:22:00"
}
```

---

## 8. Move Group

Move a group to a new parent.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/move \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_parent_id": "550e8400-e29b-41d4-a716-446655440003",
    "sort_order": 1
  }'
```

### Request Body

```json
{
  "target_parent_id": "550e8400-e29b-41d4-a716-446655440003",
  "sort_order": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_parent_id` | UUID | No | New parent group ID (null = root) |
| `sort_order` | integer | No | New sort position |

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440003",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 1,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

### Response (400 Bad Request)

```json
{
  "code": "INVALID_OPERATION",
  "status": 400,
  "message": "Cannot move group into its own subtree (circular reference)",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 9. Reorder Group

Change the sort order of a group among siblings.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/reorder \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sort_order": 5
  }'
```

### Request Body

```json
{
  "sort_order": 5
}
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 5,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 10. Duplicate Group

Deep copy a group including all descendants.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/duplicate \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_parent_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Request Body

```json
{
  "target_parent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "name": "Work Projects (Copy)",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 1,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-21T09:15:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 11. Archive Group

Archive a group and all descendants. Root group cannot be archived.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/archive \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 0,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": true,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

### Response (400 Bad Request - Root group)

```json
{
  "code": "ROOT_GROUP_PROTECTED",
  "status": 400,
  "message": "Root group cannot be archived",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 12. Unarchive Group

Unarchive a group and all archived descendants.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/unarchive \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 0,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": false,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 13. Delete Group (Soft Delete)

Soft-deletes a group and its subtree. Moved to bin for 30-day restore. Root group cannot be deleted.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

### Response (400 Bad Request - Root group)

```json
{
  "code": "ROOT_GROUP_PROTECTED",
  "status": 400,
  "message": "Root group cannot be deleted",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 14. Create Public Link

Generate a public shareable link for a group.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/public-link \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "share_token": "abc123-def456-ghi789",
  "public_url_path": "/api/v1/groups/public/abc123-def456-ghi789"
}
```

### Response (403 Forbidden - Locked group)

```json
{
  "code": "GROUP_LOCKED",
  "status": 403,
  "message": "Cannot create public link for locked group",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 15. Regenerate Public Link

Generate a new public link, invalidating the old one.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/public-link/regenerate \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "share_token": "xyz789-abc123-def456",
  "public_url_path": "/api/v1/groups/public/xyz789-abc123-def456"
}
```

---

## 16. Revoke Public Link

Remove the public link, making the group private again.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/public-link \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

---

## 17. Share Group with User

Share the group with a registered user by email.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/collaborators \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "friend@example.com",
    "role": "VIEWER"
  }'
```

### Request Body

```json
{
  "email": "friend@example.com",
  "role": "VIEWER"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered user email |
| `role` | string | Yes | `EDITOR` or `VIEWER` |

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "role": "VIEWER",
  "invited_at": "2024-01-21T09:15:00",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "username": "friend",
    "email": "friend@example.com",
    "displayName": "Friend User"
  }
}
```

### Response (409 Conflict)

```json
{
  "code": "ALREADY_SHARED",
  "status": 409,
  "message": "Group is already shared with this user",
  "timestamp": "2024-01-21T09:15:30Z"
}
```

---

## 18. List Collaborators

Returns all users this group is shared with.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/collaborators \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "role": "VIEWER",
    "invited_at": "2024-01-21T09:15:00",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "username": "friend",
      "email": "friend@example.com",
      "displayName": "Friend User"
    }
  }
]
```

---

## 19. Update Collaborator Role

Change the role of a collaborator.

### Request

```bash
curl -X PUT http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/collaborators/550e8400-e29b-41d4-a716-446655440007 \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "EDITOR"
  }'
```

### Request Body

```json
{
  "role": "EDITOR"
}
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "role": "EDITOR",
  "invited_at": "2024-01-21T09:15:00",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "username": "friend",
    "email": "friend@example.com",
    "displayName": "Friend User"
  }
}
```

---

## 20. Remove Collaborator

Remove a user from the group's collaborators.

### Request

```bash
curl -X DELETE http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/collaborators/550e8400-e29b-41d4-a716-446655440007 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (204 No Content)

No body.

---

## 21. Toggle Favorite

Toggle the favorite status of a group.

### Request

```bash
curl -X POST http://localhost:8080/api/v1/groups/550e8400-e29b-41d4-a716-446655440001/favorite \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Work Projects",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "sort_order": 0,
  "is_locked": false,
  "is_secure": false,
  "is_favorite": true,
  "is_archived": false,
  "visibility": "PRIVATE",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-21T09:15:00"
}
```

---

## 22. Get Public Group (No Auth)

Read-only access to a publicly shared group via share token.

### Request

```bash
curl -X GET http://localhost:8080/api/v1/groups/public/abc123-def456-ghi789
```

### Response (200 OK)

```json
{
  "name": "Shared Projects",
  "owner_name": "John Doe",
  "notes": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "Public Note",
      "content": "Note content...",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

## Endpoint Summary

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/groups` | Bearer | Create group |
| 2 | GET | `/groups/{id}` | Bearer | Get group by ID |
| 3 | GET | `/groups/{id}/children` | Bearer | Get children (groups + notes) |
| 4 | GET | `/groups/tree` | Bearer | Get full group tree |
| 5 | GET | `/groups/{id}/breadcrumb` | Bearer | Get breadcrumb path |
| 6 | PATCH | `/groups/{id}` | Bearer | Rename group |
| 7 | GET | `/groups/{id}/stats` | Bearer | Get statistics |
| 8 | POST | `/groups/{id}/move` | Bearer | Move group |
| 9 | POST | `/groups/{id}/reorder` | Bearer | Reorder group |
| 10 | POST | `/groups/{id}/duplicate` | Bearer | Duplicate group |
| 11 | POST | `/groups/{id}/archive` | Bearer | Archive group |
| 12 | POST | `/groups/{id}/unarchive` | Bearer | Unarchive group |
| 13 | DELETE | `/groups/{id}` | Bearer | Soft delete group |
| 14 | POST | `/groups/{id}/public-link` | Bearer | Create public link |
| 15 | POST | `/groups/{id}/public-link/regenerate` | Bearer | Regenerate link |
| 16 | DELETE | `/groups/{id}/public-link` | Bearer | Revoke public link |
| 17 | POST | `/groups/{id}/collaborators` | Bearer | Share with user |
| 18 | GET | `/groups/{id}/collaborators` | Bearer | List collaborators |
| 19 | PUT | `/groups/{id}/collaborators/{userId}` | Bearer | Update role |
| 20 | DELETE | `/groups/{id}/collaborators/{userId}` | Bearer | Remove collaborator |
| 21 | POST | `/groups/{id}/favorite` | Bearer | Toggle favorite |
| 22 | GET | `/groups/public/{token}` | No | Get public group |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Validation failed / Invalid operation |
| 401 | Unauthorized |
| 403 | Access denied / Group locked |
| 404 | Not found |
| 409 | Conflict (already shared) |
| 500 | Internal server error |