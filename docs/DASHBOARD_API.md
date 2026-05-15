# Dashboard API

The Dashboard API provides aggregated statistics and a unified recent-items feed for the authenticated user's home screen.

**Base URL:** `/api/v1/dashboard`

**Authentication:** Bearer token required on all endpoints.

---

## Endpoints

### 1. Get Dashboard Statistics

Returns counts of notes, groups, workspaces, favorites, bin items, and activity breakdowns.

```http
GET /api/v1/dashboard/stats
```

**Response — `200 OK`**

```json
{
  "totalNotes": 42,
  "totalGroups": 8,
  "totalWorkspaces": 1,
  "favoriteNotes": 5,
  "favoriteGroups": 2,
  "binItems": 3,
  "archivedNotes": 4,
  "lockedNotes": 2,
  "sharedNotes": 6,
  "activityBreakdown": {
    "CREATED": 10,
    "UPDATED": 20,
    "DELETED": 3,
    "SHARED": 5,
    "FAVORITED": 4
  },
  "totalActivities": 42,
  "activitiesToday": 5,
  "activitiesThisWeek": 15
}
```

| Field | Description |
|-------|-------------|
| `totalNotes` | All non-deleted notes owned by the user |
| `totalGroups` | All non-deleted groups in the user's workspaces |
| `totalWorkspaces` | Workspaces owned by the user |
| `favoriteNotes` | Notes marked as favorite |
| `favoriteGroups` | Groups marked as favorite |
| `binItems` | Items currently in the bin |
| `archivedNotes` | Notes with `ARCHIVED` status |
| `lockedNotes` | Notes with a lock password set |
| `sharedNotes` | Notes with `SHARED` or `PUBLIC` visibility |
| `activityBreakdown` | Count of each action type from activity logs |
| `totalActivities` | Sum of all recorded activities |
| `activitiesToday` | Activities in the last 24 hours |
| `activitiesThisWeek` | Activities in the last 7 days |

---

### 2. Get Recent Dashboard Feed

Returns a merged feed of recent notes and activities, sorted by time (newest first). Useful for a "Recent" or "What's Happening" widget.

```http
GET /api/v1/dashboard/recent
```

**Response — `200 OK`**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "NOTE",
    "title": "Meeting Notes",
    "subtitle": "Edited 12 min ago",
    "timestamp": "2025-01-15T16:30:00",
    "icon": "note"
  },
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "type": "ACTIVITY",
    "title": "CREATED",
    "subtitle": "NOTE — 25 min ago",
    "timestamp": "2025-01-15T16:17:00",
    "icon": "activity"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "NOTE",
    "title": "Project Ideas",
    "subtitle": "Edited 1 hr ago",
    "timestamp": "2025-01-15T15:45:00",
    "icon": "note"
  }
]
```

| Field | Description |
|-------|-------------|
| `id` | Item UUID (note ID or activity log ID) |
| `type` | `NOTE` or `ACTIVITY` |
| `title` | Note title or action name |
| `subtitle` | Human-readable relative time description |
| `timestamp` | ISO 8601 datetime |
| `icon` | Frontend icon hint (`note`, `activity`) |

> **Note:** The feed is limited to the **10 most recent** items across notes and activities combined.

---

## Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `401` | `AUTH_002` | Missing or invalid Bearer token |
| `500` | `INT_001` | Unexpected server error |

---

## Frontend Usage

### Load Dashboard on Mount

```javascript
async function loadDashboard() {
  const [statsRes, recentRes] = await Promise.all([
    fetch('/api/v1/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
    fetch('/api/v1/dashboard/recent', { headers: { 'Authorization': `Bearer ${token}` } })
  ]);

  const stats = await statsRes.json();
  const recent = await recentRes.json();

  return { stats, recent };
}
```

### Stats Cards

```javascript
// Example React component mapping
const cards = [
  { label: 'Notes', value: stats.totalNotes, icon: 'note' },
  { label: 'Groups', value: stats.totalGroups, icon: 'folder' },
  { label: 'Favorites', value: stats.favoriteNotes + stats.favoriteGroups, icon: 'star' },
  { label: 'Bin', value: stats.binItems, icon: 'trash' },
];
```

### Activity Breakdown Chart

```javascript
// stats.activityBreakdown is perfect for a bar/pie chart
const chartData = Object.entries(stats.activityBreakdown).map(([action, count]) => ({
  name: action,
  value: count
}));
```

### Recent Feed List

```javascript
recent.map(item => (
  <li key={item.id} className={item.type.toLowerCase()}>
    <span className="icon">{item.icon}</span>
    <div>
      <div className="title">{item.title}</div>
      <div className="subtitle">{item.subtitle}</div>
    </div>
  </li>
));
```

---

## Data Sources

| Stat | Source |
|------|--------|
| Notes counts | `note_repo` (owner-scoped) |
| Groups counts | `group_repo` (workspace owner-scoped) |
| Workspaces | `workspace_repo` (owner-scoped) |
| Bin items | `bin_item_repo` (owner-scoped) |
| Activities | `activity_log_repo` (user-scoped) |
| Locked/shared | In-memory filter on active notes |

All counts respect soft-delete filters (`deleted_at IS NULL`) automatically via JPA `@SQLRestriction`.

---

## Performance

- Stats are computed on-demand from indexed columns.
- No heavy joins; each count is a separate lightweight query.
- The recent feed runs two small queries (top 5 notes + top 5 activities) and merges in memory.
- For very large datasets, consider adding a materialized view or caching layer.

---

## Files

| File | Purpose |
|------|---------|
| `controller/DashboardController.java` | REST endpoints |
| `service/DashboardService.java` | Interface |
| `service/impl/DashboardServiceImpl.java` | Aggregation logic |
| `dto/response/DashboardStatsResponse.java` | Stats payload |
| `dto/response/DashboardRecentItemResponse.java` | Feed item payload |
| `repo/NoteRepo.java` | Added `countByOwnerId`, `countByOwnerIdAndIsFavoriteTrue`, `findRecentByOwnerId` |
| `repo/GroupRepo.java` | Added `countByWorkspaceOwnerId`, `countByWorkspaceOwnerIdAndIsFavoriteTrue` |
| `repo/WorkspaceRepo.java` | Added `countByOwnerId` |
| `repo/BinItemRepo.java` | Added `countByOwnerId` |
| `repo/ActivityLogRepo.java` | Added `findTop5ByUserIdOrderByCreatedAtDesc` |
| `docs/DASHBOARD_API.md` | This document |
