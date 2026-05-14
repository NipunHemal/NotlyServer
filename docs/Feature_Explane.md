# Notly — Feature Deep Explanation & Implementation Plan
**Note Management System · Section-by-Section Breakdown**

---

## Table of Contents

1. [Create Document](#1-create-document)
2. [Share Document](#2-share-document)
3. [Move to Folder (Nested Groups)](#3-move-to-folder-nested-groups)
4. [Add Lock to Note](#4-add-lock-to-note)
5. [Create Secure Note (Password-Protected Folder)](#5-create-secure-note-password-protected-folder)
6. [Share Note Publicly or via Email](#6-share-note-publicly-or-via-email)
7. [Add Password to Note or Group](#7-add-password-to-note-or-group)
8. [Delete Note](#8-delete-note)
9. [Archive Note](#9-archive-note)
10. [Nested Folder System](#10-nested-folder-system)
11. [New Matching Features](#11-new-matching-features)
12. [4-Step Implementation Plan](#12-4-step-implementation-plan)

---

## 1. Create Document

### What It Is
The core action of the entire application. A document (note) is the primary unit of content in Notly. When a user creates a document, a new editable page is instantly opened inside the current group (folder).

### How It Works — Deep Explanation

**Trigger:** User clicks the "+ New Note" button (FAB), presses a keyboard shortcut `Ctrl+N`, or uses the slash command inside a group.

**Frontend flow:**
1. A `POST /api/docs` request is sent immediately with a default title `"Untitled"` and an empty content body.
2. The backend responds with the new document's `id` and metadata.
3. The frontend navigates the user directly into the editor for that document — no loading screen.
4. The title input is focused and ready to type.

**Autosave:**
- Every keystroke starts a 2-second debounce timer.
- After 2 seconds of inactivity, a `PATCH /api/docs/{id}` request sends the latest title + content.
- A small "Saved" indicator appears in the toolbar to confirm.
- If the user closes the tab before autosave triggers, the last debounced state is sent immediately (`beforeunload` event).

**Document Properties created at birth:**
| Property | Default Value |
|---|---|
| `title` | "Untitled" |
| `content` | Empty (block editor JSON) |
| `status` | `ACTIVE` |
| `visibility` | `PRIVATE` |
| `groupId` | Current group the user is in |
| `ownerId` | Logged-in user |
| `createdAt` | Server timestamp |

**Block Editor (Tiptap):**
- The editor is a block-based rich text system.
- Each paragraph, heading, list, image, or table is an independent "block".
- Blocks can be dragged and reordered.
- The slash `/` command opens a block picker menu.
- Content is stored as structured JSON in the database (not raw HTML).

**Backend Entity:**
```java
@Entity
public class Document {
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;       // Tiptap JSON as string
    private Long groupId;
    private Long ownerId;
    private String status;        // ACTIVE, ARCHIVED, PENDING_DELETED
    private String visibility;    // PRIVATE, SHARED, PUBLIC
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
```

### New Matching Features
- **Document Templates** — Prebuilt templates (Meeting Notes, To-Do List, Project Plan) users can pick when creating a new document instead of starting blank.
- **Quick Capture** — A floating mini note input accessible from any page. Type a quick thought, hit Enter, and it saves as a new document in the default workspace.
- **Duplicate on Create** — Copy any existing document as a starting point via the action menu.

---

## 2. Share Document

### What It Is
Sharing allows document owners to give other users access to read or edit a document. Notly supports three sharing modes: share via email (invite a specific person), share via public link (anyone with the link can view), and internal collaboration (add a collaborator with a role).

### How It Works — Deep Explanation

**Three Sharing Modes:**

#### Mode A — Share via Email (Invite)
1. Owner opens the Share modal on a document.
2. Types an email address and selects a role: `EDITOR` or `VIEWER`.
3. Frontend calls `POST /api/share/{docId}` with `{ email, role }`.
4. Backend checks if that email belongs to a registered user:
    - **If yes:** creates a `Collaborator` record linking the user to the document.
    - **If no:** sends an invitation email with a signup + auto-accept link.
5. The invited user sees the document in their "Shared with me" section after accepting.

#### Mode B — Share via Public Link
1. Owner toggles "Public Link" in the Share modal.
2. Backend sets `visibility = PUBLIC` on the document and generates a unique share token: `GET /api/docs/public/{shareToken}`.
3. Anyone with the link can view the document — **no login required**.
4. Owner can revoke the link at any time (sets `visibility = PRIVATE`, invalidates token).

#### Mode C — Internal Collaborator (Role-based)
Each collaborator has one of three roles:

| Role | Permissions |
|---|---|
| `OWNER` | Full control — edit, share, delete, lock, transfer ownership |
| `EDITOR` | Can edit content and add blocks, cannot delete or change permissions |
| `VIEWER` | Read-only access, can copy text but cannot edit |

**Viewer Tracking:**
- Every time a `VIEWER` or `EDITOR` opens a shared document, the backend logs:
    - `viewedAt` (timestamp)
    - `viewCount` (incremented)
- The owner can see "Viewed by John at 3:42 PM" in the document info panel.

**Collaborator Avatars:**
- When multiple collaborators have the document open simultaneously, their avatars appear at the top of the editor (future: real-time cursors).

**Backend — Collaborator Entity:**
```java
@Entity
public class Collaborator {
    private Long id;
    private Long documentId;
    private Long userId;
    private String role;           // OWNER, EDITOR, VIEWER
    private LocalDateTime viewedAt;
    private Integer viewCount;
    private LocalDateTime invitedAt;
    private Boolean accepted;
}
```

**API Endpoints:**
```
POST   /api/share/{docId}              → Invite collaborator (email + role)
GET    /api/share/{docId}              → List all collaborators
PUT    /api/share/{docId}/{userId}     → Change role
DELETE /api/share/{docId}/{userId}     → Remove collaborator
GET    /api/docs/public/{shareToken}   → Public link access (no auth)
```

### New Matching Features
- **Share Expiry** — Set an expiry date on a public link or collaborator invite. After the date, access is automatically revoked.
- **View-Only Password Link** — Public link that still requires a password to open (combines public + lock features).
- **Share Analytics** — Track total views, unique viewers, and last viewed time on the document detail page.

---

## 3. Move to Folder (Nested Groups)

### What It Is
Documents and groups can be moved between folders (groups) freely. This is the primary organization mechanic — users drag a note into a different folder or use the "Move" action from the context menu.

### How It Works — Deep Explanation

**Two ways to move:**

#### Method A — Drag and Drop (Frontend)
1. User grabs a document card or group card in the sidebar/grid.
2. A drag ghost shows the item being dragged.
3. Valid drop targets highlight as the user hovers over them.
4. On drop, frontend calls `POST /api/docs/{id}/move` with `{ targetGroupId }`.
5. The item instantly appears in the new location (optimistic update).
6. If the server rejects the move (permission error), the item snaps back with a toast.

#### Method B — Move Modal (Action Menu)
1. User clicks the "Move" option in the 11-action menu (⋯ button).
2. A modal opens showing a folder tree picker.
3. User navigates the tree and selects a destination group.
4. Frontend calls `POST /api/docs/{id}/move` with `{ targetGroupId }`.

**Permission Rules:**
- Only the document `OWNER` or a group `OWNER` can move items.
- `EDITOR` role cannot move documents — only edit content.
- Cannot move a group into one of its own children (circular reference prevention).

**Circular Reference Prevention (Groups):**
```java
// Backend check before moving group
public boolean isDescendant(Long groupId, Long targetId) {
    Group target = groupRepo.findById(targetId);
    while (target.getParentId() != null) {
        if (target.getParentId().equals(groupId)) return true;
        target = groupRepo.findById(target.getParentId());
    }
    return false;
}
```

**Activity Log Entry:**
- Every move creates an activity entry: `"Moved 'Project Plan' from Work → Personal > Archive"`

**API:**
```
POST /api/docs/{id}/move    body: { targetGroupId }
POST /api/groups/{id}/move  body: { targetGroupId }
```

### New Matching Features
- **Breadcrumb Trail** — A clickable breadcrumb at the top of every document showing its full folder path: `Workspace / Work / Q3 Reports / Note.md`. Clicking any segment navigates there.
- **Multi-Select Move** — Select multiple documents with checkboxes and move them all to a folder in one action.
- **Recently Moved** — A "Recent Locations" quick-list in the move modal showing the last 5 folders a user moved items to.
- **Copy to Folder** — In addition to Move, a "Copy" action creates a duplicate of the document in the target folder without removing the original.

---

## 4. Add Lock to Note

### What It Is
A locked note requires the user to enter a password before the content is displayed. The lock is a **display-level security layer** — the note still exists and is visible in the list, but content is hidden behind a password prompt.

### How It Works — Deep Explanation

**Lock Flow — Step by step:**

1. User opens the action menu (⋯) on a note → clicks "Lock".
2. A modal appears: "Set a password for this note".
3. User enters and confirms a password.
4. Frontend calls `POST /api/docs/{id}/lock` with `{ password }`.
5. Backend hashes the password with BCrypt and stores it in `Document.passwordHash`.
6. Backend sets `Document.isLocked = true`.
7. The document card in the UI now shows a 🔒 lock icon.

**Unlock Flow:**
1. User clicks on a locked note.
2. Instead of the editor, a password prompt screen appears.
3. User types the password → frontend calls `POST /api/docs/{id}/unlock` with `{ password }`.
4. Backend verifies BCrypt hash: `BCrypt.checkpw(inputPassword, storedHash)`.
5. If correct → backend returns a **temporary session unlock token** (valid for the current session).
6. Frontend stores the unlock token in memory (not localStorage) — the note stays unlocked until tab closes.
7. If incorrect → "Wrong password" error + lock remains.

**Important Security Notes:**
- The password hash is **never sent to the frontend**.
- The document content is **not encrypted at rest** (out of scope for this project) — the lock is a UI gate.
- The owner can **remove the lock** by verifying the password first, then calling `DELETE /api/docs/{id}/lock`.
- If the owner forgets the password, only an admin can reset it (no recovery for security).

**Backend Fields:**
```java
private Boolean isLocked = false;
private String passwordHash;        // BCrypt hash, never exposed in DTO
```

**API:**
```
POST   /api/docs/{id}/lock     body: { password }
POST   /api/docs/{id}/unlock   body: { password }  → returns session token
DELETE /api/docs/{id}/lock     body: { password }  → remove lock entirely
POST   /api/groups/{id}/lock   body: { password }  → same for groups
```

### New Matching Features
- **Lock Timeout** — Automatically re-lock a note after N minutes of inactivity (configurable: 5, 15, 30 minutes).
- **Biometric Hint** — On mobile, show a fingerprint icon as a hint for future biometric unlock integration.
- **Wrong Password Cooldown** — After 5 failed attempts, impose a 60-second cooldown to prevent brute force.
- **Lock All in Group** — One-click action to lock all documents inside a group simultaneously.

---

## 5. Create Secure Note (Password-Protected Folder)

### What It Is
A **Secure Note** is a special document type created inside a **Secure Group** (password-protected folder). Unlike a regular locked note (which locks display), a Secure Group enforces a password at the folder level — accessing ANY note inside requires unlocking the group first. This is Notly's "vault" concept.

### How It Works — Deep Explanation

**Secure Group vs Regular Lock — Key Difference:**

| Feature | Regular Lock | Secure Group (Vault) |
|---|---|---|
| Applied to | Single document | Entire group (all notes inside) |
| Lock level | Display gate on one note | Folder gate — all contents hidden |
| Password | Per-document | Per-group, applies to all children |
| Visibility | Note appears in lists (locked icon) | Group contents completely hidden until unlocked |
| Use case | Lock one sensitive note | Create a private vault folder |

**Creating a Secure Group — Step by step:**

1. User right-clicks on the sidebar or uses "+ New Group" → selects "Secure Group".
2. A special creation modal opens asking for a group name and password.
3. Frontend calls `POST /api/groups` with `{ name, isSecure: true, password }`.
4. Backend creates the group with `isLocked = true` + `passwordHash = BCrypt(password)`.
5. The group appears in the sidebar with a 🔐 shield icon.
6. Clicking the group shows a lock screen — user must enter the group password.
7. After unlocking, all notes inside are accessible normally for the session.

**Creating a Secure Note inside the Secure Group:**
1. Once the group is unlocked, user creates a note normally.
2. The note inherits the group's security context — it's "secured by the group".
3. The note itself doesn't need an individual password (the group acts as the gate).
4. Notes inside a secure group can ALSO have individual passwords for double-layer security.

**Nested Secure Groups:**
- A Secure Group can contain other Secure Groups.
- Each nested group requires its own password.
- Unlocking a parent group does NOT automatically unlock secure child groups.

**Backend — Secure Group:**
```java
@Entity
public class Group {
    private Long id;
    private String name;
    private Long parentId;         // null = root level
    private Long ownerId;
    private Boolean isLocked;      // regular lock
    private Boolean isSecure;      // vault mode — full content hide
    private String passwordHash;   // BCrypt hash
    private Boolean isArchived;
    private Boolean isFavorite;
}
```

### New Matching Features
- **Secure Note Quick-Create** — Keyboard shortcut `Ctrl+Shift+N` creates a secure note directly in the active secure group.
- **Auto-Lock Timer on Group** — Secure group automatically re-locks after inactivity (like a phone screen timeout).
- **Decoy Password** — Advanced feature: set a "decoy" password that shows a fake empty vault (protects against coercion). The real password shows actual contents.
- **Group Unlock History** — Log of when the secure group was unlocked and by whom (for shared secure groups).

---

## 6. Share Note Publicly or via Email

### What It Is
Two distinct sharing paths: **Public sharing** makes a note readable by anyone with a link (no login needed). **Email sharing** sends a direct invitation to a specific person, granting them a defined role (Editor or Viewer).

### How It Works — Deep Explanation

#### Public Sharing — Deep Dive

**How the public link works:**
1. Owner toggles "Public" in the Share modal.
2. Backend generates a unique UUID token: `shareToken = UUID.randomUUID()`.
3. Token is stored on the document: `Document.shareToken`.
4. Document visibility is set to `PUBLIC`.
5. Public URL format: `https://notly.app/p/{shareToken}`.
6. Anyone visiting the URL can read the note — no account required.

**Public link behavior:**
- The note renders in a clean read-only view (no editor UI).
- Owner's name and avatar are shown at the top ("Shared by [Name]").
- View count is tracked anonymously.
- Comments and edits are disabled.
- The owner can copy the link, regenerate it (new token, old link breaks), or disable it.

**Regenerate Link:** `POST /api/docs/{id}/regenerate-link`
- Creates a new `shareToken`, old link becomes invalid instantly.
- Useful if the link was shared accidentally.

#### Email Sharing — Deep Dive

**Invitation flow:**
```
Owner types email → POST /api/share/{docId} { email, role }
    ↓
Backend: Is email a registered user?
    ↓ YES                         ↓ NO
Create Collaborator record    Send invitation email with
Set accepted = true           one-time signup/accept link
                                  ↓
                             User clicks link → auto-registered
                             → Collaborator record created
                             → Redirected to the shared note
```

**Email content (invitation):**
- "John Smith has invited you to view/edit [Note Title]"
- A large "Open Note" CTA button.
- The role is embedded in a signed JWT link — no manual role assignment needed.

**Permission enforcement on backend:**
```java
// Every document request checks this
public boolean canAccess(Long userId, Long docId, String requiredRole) {
    Document doc = docRepo.findById(docId);
    if (doc.getOwnerId().equals(userId)) return true;  // Owner always allowed
    if (doc.getVisibility().equals("PUBLIC")) return true; // Public allowed for read
    Collaborator collab = collabRepo.findByDocIdAndUserId(docId, userId);
    return collab != null && roleHierarchy(collab.getRole()) >= roleHierarchy(requiredRole);
}
```

### New Matching Features
- **Share Expiry Date** — When sharing via email, set "Access expires in: 7 days / 30 days / Never". Backend auto-removes collaborator on expiry.
- **Read Receipt** — Owner gets a notification when a shared viewer opens the note for the first time.
- **Bulk Share** — Share multiple selected notes to the same person/email in one action.
- **Unshare All** — One-click button to remove all collaborators and set visibility back to private.

---

## 7. Add Password to Note or Group

### What It Is
This is the general password protection feature that works on both individual notes and entire groups. It combines the lock mechanism with optional visibility control — a password-protected note can still appear in lists (so others know it exists) but its content is gated.

### How It Works — Deep Explanation

**Password on a Note:**
- Stored as a BCrypt hash in `Document.passwordHash`.
- The note card shows a 🔒 icon.
- Clicking the note shows a password input screen before the editor loads.
- The password is checked server-side — the client never sees the hash.
- A correct password grants a session-scoped unlock token (invalidated on page close).

**Password on a Group:**
- Stored as a BCrypt hash in `Group.passwordHash`.
- The group folder shows a 🔒 icon in the sidebar.
- Clicking the group shows a password prompt before the group contents are shown.
- Once unlocked, all notes inside the group are accessible without individual passwords (unless they also have their own passwords).

**Password Strength Rules (Frontend validation):**
- Minimum 6 characters
- At least one number or special character
- Shown as a strength meter (Weak / Fair / Strong)

**Change Password Flow:**
1. User opens Lock Settings on the note/group.
2. Enters current password (verified by backend).
3. Enters and confirms new password.
4. Backend re-hashes and stores the new password.
5. All active session unlock tokens for that item are invalidated.

**Remove Password Flow:**
1. User selects "Remove Password" in Lock Settings.
2. Must enter current password to confirm.
3. Backend sets `isLocked = false`, clears `passwordHash`.

**Security considerations:**
- Password hashes use BCrypt with cost factor 12.
- Failed unlock attempts are rate-limited (5 attempts → 60s cooldown).
- Passwords are never logged, never returned in API responses.
- All password operations use HTTPS only.

**API:**
```
POST   /api/docs/{id}/lock         body: { password }
POST   /api/docs/{id}/unlock       body: { password }
PUT    /api/docs/{id}/lock         body: { currentPassword, newPassword }
DELETE /api/docs/{id}/lock         body: { password }

POST   /api/groups/{id}/lock       body: { password }
POST   /api/groups/{id}/unlock     body: { password }
PUT    /api/groups/{id}/lock       body: { currentPassword, newPassword }
DELETE /api/groups/{id}/lock       body: { password }
```

### New Matching Features
- **Master Password** — A single account-level master password that can unlock any locked item the user owns (like a recovery key). Stored as a separate BCrypt hash on the user account.
- **Password Hint** — Optional hint text stored in plaintext (e.g., "My dog's name") shown below the password input to help the owner remember.
- **Temporary Access Code** — Generate a one-time 6-digit code that unlocks a note once, then expires. Useful for sharing locked content briefly.

---

## 8. Delete Note

### What It Is
Notly uses a **two-stage deletion system**: soft delete (Bin) and permanent delete. Deleting a note first moves it to the Bin where it stays for 30 days before being permanently erased. Users can restore notes from the Bin at any time during those 30 days.

### How It Works — Deep Explanation

#### Stage 1 — Soft Delete (Move to Bin)

**Trigger:** User clicks "Delete" in the action menu, or presses `Delete` key with the note selected.

**Flow:**
1. A confirmation dialog appears: "Move to Bin? You can restore it within 30 days."
2. User confirms → Frontend calls `DELETE /api/docs/{id}`.
3. Backend sets `status = PENDING_DELETED` and `deletedAt = now()`.
4. The note disappears from all group views and search results immediately.
5. The note appears in the Bin (`GET /api/bin`).

**What happens in the Bin:**
- Each item shows: title, original group location, and "Deletes in X days" countdown.
- The countdown is calculated: `30 - (now - deletedAt).days`.
- Items are sorted by soonest-to-expire first.
- Locked notes in the Bin are still locked — must unlock to restore.

#### Stage 2 — Restore from Bin

**Flow:**
1. User opens the Bin section.
2. Clicks "Restore" on a note → `POST /api/bin/{id}/restore`.
3. Backend sets `status = ACTIVE`, clears `deletedAt`.
4. Note returns to its original group (if group still exists) or to the default workspace.
5. Toast: "Note restored to [Group Name]".

**If original group was also deleted:**
- The note is restored to the user's default workspace (root group).
- Toast: "Note restored to Workspace (original folder was deleted)".

#### Stage 3 — Permanent Delete

**Flow:**
1. User selects "Delete Permanently" in the Bin action menu.
2. Confirmation dialog: "This cannot be undone. All versions and collaborators will be removed."
3. User confirms → `DELETE /api/bin/{id}/permanent`.
4. Backend hard-deletes the document row AND all related records:
    - All `Version` records for this document
    - All `Collaborator` records
    - All `Reminder` records
    - All `Activity` records referencing this document
5. Note is gone forever.

**Auto-Delete Scheduler:**
```java
@Scheduled(cron = "0 0 0 * * ?")   // Runs daily at midnight
public void autoDeleteExpiredNotes() {
    LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
    List<Document> expired = docRepo.findByStatusAndDeletedAtBefore("PENDING_DELETED", cutoff);
    for (Document doc : expired) {
        versionRepo.deleteByDocumentId(doc.getId());
        collabRepo.deleteByDocumentId(doc.getId());
        reminderRepo.deleteByDocumentId(doc.getId());
        activityRepo.deleteByDocumentId(doc.getId());
        docRepo.delete(doc);
    }
}
```

**Bulk Delete:**
- User can select multiple notes with checkboxes.
- "Delete Selected" moves all to Bin in one action.
- "Empty Bin" permanently deletes all Bin items instantly.

### New Matching Features
- **Undo Delete Toast** — After soft-deleting, show a 5-second "Undo" toast that instantly restores the note without going to the Bin.
- **Delete Group Cascade** — When a group is deleted, the user chooses: "Move all notes to Workspace" or "Delete all notes too". Never a silent cascade.
- **Bin Search** — Search inside the Bin by title to find specific deleted notes.
- **Protected from Delete** — A "Pin to prevent delete" flag that blocks accidental deletion — user must unpin before the delete option appears.

---

## 9. Archive Note

### What It Is
Archiving is a **non-destructive way to declutter** the workspace. Archived notes are hidden from the main view but are NOT deleted — they are fully preserved with all content, versions, and collaborators intact. The archive is a permanent state (no 30-day timer like the Bin).

### How It Works — Deep Explanation

**Archive vs Delete — Key Differences:**

| | Archive | Delete (Bin) |
|---|---|---|
| Content preserved | ✅ Yes, forever | ⏳ For 30 days |
| Searchable | ✅ Yes (with filter) | ❌ Not in main search |
| Auto-expiry | ❌ Never | ✅ 30 days |
| Collaborators | ✅ Preserved | ✅ Preserved until permanent delete |
| Use case | Long-term storage, finished work | Mistake or unwanted note |

**Archive Flow:**
1. User clicks "Archive" in the action menu.
2. No confirmation dialog needed (non-destructive).
3. Frontend calls `POST /api/docs/{id}/archive`.
4. Backend sets `status = ARCHIVED`.
5. Note disappears from the main group view.
6. Note appears in the "Archived" section (accessible from the sidebar).
7. Toast: "Note archived. Find it in Archive anytime."

**Archived Section UI:**
- Accessible via sidebar: `📦 Archive`.
- Shows all archived notes in a grid/list.
- Filter by: original group, date archived, tags.
- Search inside Archive by title or content.
- Each archived note shows when it was archived.

**Unarchive Flow:**
1. User opens Archive section.
2. Clicks "Unarchive" on a note → `POST /api/docs/{id}/unarchive`.
3. Backend sets `status = ACTIVE`.
4. Note returns to its original group.

**Archive a Group:**
- Archiving a group also archives all documents inside it.
- The group disappears from the sidebar tree.
- All notes inside are preserved and accessible via Archive.
- Unarchiving the group restores all notes to their previous positions.

**Backend:**
```java
// Archive document
public void archiveDocument(Long docId, Long userId) {
    Document doc = docRepo.findByIdAndOwnerId(docId, userId);
    doc.setStatus("ARCHIVED");
    doc.setArchivedAt(LocalDateTime.now());
    docRepo.save(doc);
    activityService.log(userId, docId, "ARCHIVE_DOC");
}

// Unarchive
public void unarchiveDocument(Long docId, Long userId) {
    Document doc = docRepo.findByIdAndOwnerId(docId, userId);
    doc.setStatus("ACTIVE");
    doc.setArchivedAt(null);
    docRepo.save(doc);
}
```

**API:**
```
POST /api/docs/{id}/archive
POST /api/docs/{id}/unarchive
GET  /api/docs?status=ARCHIVED     → List all archived notes
POST /api/groups/{id}/archive
POST /api/groups/{id}/unarchive
```

### New Matching Features
- **Archive Schedule** — Set a note to auto-archive on a specific date (e.g., archive this project note on Dec 31st).
- **Archive Summary Email** — Monthly digest of what's in your archive — helps users rediscover old notes.
- **Archive Tags** — Tag archived notes with categories like "Reference", "Completed", "Old Project" for better organization inside the archive.

---

## 10. Nested Folder System

### What It Is
The nested folder system (Groups) is the organizational backbone of Notly. Groups are folders that can contain notes AND other groups, creating a tree-like hierarchy with no depth limit. This is the "Folders 2.0" system that replaces flat folder structures.

### How It Works — Deep Explanation

**Data Structure — Self-Referencing Tree:**
```
Workspace (root, parentId = null)
├── Work (parentId = Workspace.id)
│   ├── Q3 Reports (parentId = Work.id)
│   │   ├── Report_July.md
│   │   └── Report_August.md
│   └── Meetings (parentId = Work.id)
│       └── Standup_Notes.md
├── Personal (parentId = Workspace.id)
│   ├── 🔐 Journal (parentId = Personal.id, isSecure=true)
│   └── Ideas (parentId = Personal.id)
└── Archive (system group)
```

**Backend — Self-Referencing Entity:**
```java
@Entity
public class Group {
    private Long id;
    private String name;
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Group parent;           // null = root group
    @OneToMany(mappedBy = "parent")
    private List<Group> children;   // sub-groups
    @OneToMany
    private List<Document> documents;
    private Long ownerId;
    private Integer depth;          // cached depth level (0 = root)
    private String path;            // cached: "/Work/Q3 Reports"
}
```

**Tree Retrieval — Recursive Query:**
```java
// Return full tree in one query using recursive CTE
@Query(value = """
    WITH RECURSIVE group_tree AS (
        SELECT * FROM groups WHERE parent_id IS NULL AND owner_id = :userId
        UNION ALL
        SELECT g.* FROM groups g
        INNER JOIN group_tree gt ON g.parent_id = gt.id
    )
    SELECT * FROM group_tree
    """, nativeQuery = true)
List<Group> findFullTree(@Param("userId") Long userId);
```

**Frontend — Sidebar Tree Component:**
- Each group node has a toggle arrow (▶ / ▼) to expand/collapse.
- Clicking a group navigates to its contents.
- Dragging a note over a group (for 1 second) expands it — "spring loading".
- Right-clicking a group opens a context menu with all group actions.
- The active group is highlighted in the tree.

**Drag and Drop — Full Rules:**
- Notes can be dragged into any group the user has owner/editor access to.
- Groups can be dragged into any other group (except their own descendants).
- Dragging onto the root level removes the item from any parent group.
- Dragging multiple selected items moves all simultaneously.

**Breadcrumb Navigation:**
- Every page shows a breadcrumb: `Workspace / Work / Q3 Reports`.
- Each segment is clickable and navigates to that group.
- The breadcrumb collapses long paths: `Workspace / ... / Q3 Reports`.

**Group Statistics (Analytics):**
- Each group shows: note count, last modified date, collaborator count.
- Group detail page shows a mini activity timeline.

**API:**
```
GET  /api/groups/tree              → Full nested tree (recursive)
GET  /api/groups/{id}/children     → Direct children only
GET  /api/groups/{id}/breadcrumb   → Path from root to this group
POST /api/groups/{id}/move         → Move group to new parent
GET  /api/groups/{id}/stats        → Note count, last activity
```

### New Matching Features
- **Group Templates** — Create a new group from a predefined template (e.g., "Project Folder" template creates: Meetings, Notes, Resources, and Archive sub-groups automatically).
- **Smart Group (Saved Filter)** — A virtual group that auto-populates based on a filter rule: "Show all notes tagged #urgent created this week". Like a saved search that looks like a folder.
- **Group Color + Icon** — Each group can have a custom color and emoji/icon for visual differentiation in the sidebar.
- **Group Shortcuts** — Pin any group to the top of the sidebar as a shortcut (independent of its position in the tree).
- **Collapse All / Expand All** — One-click to collapse or expand the entire sidebar tree.

---

## 11. New Matching Features (Additional)

These new features naturally complement and extend the note management system:

### 11.1 Tags System
- Add multiple tags to any note (e.g., `#work`, `#urgent`, `#q3`).
- AI can suggest tags based on content.
- Filter notes by tag across the entire workspace.
- Tag cloud visualization showing most-used tags.

### 11.2 Reminder & Notification System
- Set a reminder on any note for a specific date/time.
- Notifications delivered in-app and optionally via email.
- "Remind me tomorrow", "Remind me next week" quick-set options.
- Reminder list page showing all upcoming reminders.

### 11.3 Favorites / Pinned Notes
- Star any note or group to add it to the Favorites section.
- Favorites appear at the top of the sidebar for instant access.
- "Priority" filter to show only favorited items.

### 11.4 Activity Feed
- Dashboard shows a chronological feed of all actions across the workspace.
- Events: "You created X", "John edited Y", "Note Z was shared".
- Filterable by event type and date range.

### 11.5 Version History (Snapshots)
- Manual "Make Version" action saves a named snapshot of the note at that moment.
- Version timeline in the right sidebar shows all snapshots.
- Click any version to preview it in read-only mode.
- "Restore" button replaces current content with the version snapshot.

### 11.6 Full-Text Search
- `Cmd+K` opens a global search palette.
- Searches by: title, content, tags, group name.
- Results highlight matching text snippets.
- Filter by: file type, date, group, collaborator.

### 11.7 Export & Download
- Export any note as: PDF, Markdown (.md), or Plain Text (.txt).
- PDF export preserves formatting, headings, and images.
- Markdown export preserves all block structure.
- Bulk export: select multiple notes → download as a zip.

---

## 12. 4-Step Implementation Plan

---

### ✅ Step 1 — Foundation (Backend Core + Auth + Data Layer)

**Goal:** The database is set up, authentication works end-to-end, and the base entities for all features are ready. Nothing works on the frontend yet, but the backend is solid.

**What to build:**

**1.1 Project Setup**
- Initialize Spring Boot 3 project (Maven, Java 17).
- Add dependencies: Spring Web, Spring Security, Spring Data JPA, PostgreSQL, JJWT, Lombok, BCrypt.
- Initialize Next.js 14 project (App Router, TypeScript, Tailwind CSS, shadcn/ui).
- Configure PostgreSQL connection in `application.yml`.
- Set up CORS to allow Next.js frontend origin.

**1.2 Database Schema — All tables created upfront**
```sql
-- Create all tables in one migration
CREATE TABLE users (id, email, password_hash, role, created_at);
CREATE TABLE groups (id, name, parent_id, owner_id, is_locked, is_secure, password_hash, is_archived, is_favorite, depth, path);
CREATE TABLE documents (id, title, content, group_id, owner_id, status, visibility, share_token, is_locked, password_hash, deleted_at, archived_at, created_at, updated_at);
CREATE TABLE versions (id, document_id, label, content, created_by, created_at);
CREATE TABLE collaborators (id, document_id, user_id, role, viewed_at, view_count, accepted, invited_at);
CREATE TABLE activities (id, user_id, document_id, event_type, description, created_at);
CREATE TABLE reminders (id, user_id, document_id, remind_at, is_triggered);
CREATE TABLE tags (id, name, document_id);
CREATE TABLE friends (id, user_id, friend_id, created_at);
```

**1.3 Auth System**
- `User` entity + `UserRepository`.
- `POST /api/auth/register` — BCrypt hash password, create user.
- `POST /api/auth/login` — Verify password, return Access Token + Refresh Token (JWT).
- `POST /api/auth/refresh` — Validate refresh token, issue new access token.
- `GET /api/auth/me` — Return current user from JWT.
- `JwtFilter` — Intercept all requests, validate token, set `SecurityContext`.
- `SecurityConfig` — Permit `/api/auth/**`, require auth on all else.

**1.4 Base Entities + Repositories**
- Create all JPA entities: `Document`, `Group`, `Version`, `Collaborator`, `Activity`, `Reminder`, `Tag`.
- Create all JPA repositories (extend `JpaRepository`).
- Create base DTOs for request and response.
- Create global `@RestControllerAdvice` for exception handling.

**Deliverable at end of Step 1:**
- Postman can register, login, and hit `/api/auth/me` with the JWT.
- All DB tables exist and are correct.
- No frontend features yet — just API + DB.

---

### ✅ Step 2 — Core Features (Groups + Documents + Editor + Autosave)

**Goal:** The main application works. Users can log in, create groups, create notes, write in the editor, and have their content autosaved. This is the MVP.

**What to build:**

**2.1 Group System (Backend)**
- `GroupController` + `GroupService` with full CRUD.
- `GET /api/groups/tree` — Recursive CTE query returning full nested tree.
- `POST /api/groups/{id}/move` — Move group to new parent (with circular reference check).
- `POST /api/groups/{id}/duplicate` — Deep copy group + all its notes.
- `POST /api/groups/{id}/archive` — Set all children to ARCHIVED.
- `POST /api/groups/{id}/favorite` — Toggle isFavorite.

**2.2 Document System (Backend)**
- `DocumentController` + `DocumentService` with full CRUD.
- `PATCH /api/docs/{id}` — Autosave endpoint (partial update, title + content).
- `POST /api/docs/{id}/move` — Move to different group.
- `POST /api/docs/{id}/duplicate` — Copy document with all metadata.
- `POST /api/docs/{id}/archive` + `/unarchive`.
- `DELETE /api/docs/{id}` — Soft delete (status = PENDING_DELETED).
- `GET /api/docs/search?q=` — Full text search on title + tags.
- `GET /api/bin` — List soft-deleted documents.
- `POST /api/bin/{id}/restore` — Restore from bin.
- `DELETE /api/bin/{id}/permanent` — Hard delete with cascade.
- `@Scheduled` cron — Auto-delete items older than 30 days.

**2.3 Auth + Dashboard UI (Frontend)**
- Login and Register pages with form validation.
- Axios instance with JWT interceptor (auto-refresh on 401).
- Protected route HOC — redirect to login if no token.
- Dashboard page: greeting, stats cards (total notes, shared, favorites, reminders).
- Activity feed component (placeholder data for now).

**2.4 Sidebar + Group Navigation (Frontend)**
- Recursive sidebar tree component from `GET /api/groups/tree`.
- Collapse/expand toggle per group node.
- Active group highlight.
- Breadcrumb navigation at top of every page.
- Group action menu (⋯): rename, move, duplicate, archive, delete.
- "New Group" button with name input inline.
- Drag and drop groups (using `@dnd-kit/core`).

**2.5 Block Editor (Frontend) — Tiptap**
- Install: `@tiptap/react`, `@tiptap/starter-kit`, and all extension packages.
- Configure extensions: Heading, BulletList, OrderedList, TaskList, Blockquote, CodeBlock, HorizontalRule, Image, Table, Highlight, Typography.
- Large title input above the editor (synced to document title).
- Slash command extension — `/` opens block picker popup.
- Inline formatting toolbar (appears on text selection).
- Drag handle for blocks (`@tiptap/extension-drag-handle`).
- Autosave: `useEffect` with `setTimeout` debounce (2s) → `PATCH /api/docs/{id}`.
- "Saved" / "Saving..." indicator in toolbar.

**Deliverable at end of Step 2:**
- User can log in, see the dashboard, create groups and sub-groups.
- User can create a note, write in the block editor, and content autosaves.
- User can move notes between groups via action menu.
- User can soft-delete notes and restore from Bin.

---

### ✅ Step 3 — Advanced Features (AI + Versions + Collaboration + Security)

**Goal:** All the advanced and differentiating features are working. AI tools, version snapshots, sharing, and password locking are complete.

**What to build:**

**3.1 AI Features (Backend)**
- `AiService` — Uses Spring `WebClient` to call OpenAI or Anthropic API.
- Keep prompts in `AiPrompts.java` as constants.
- `POST /api/ai/summarize` — Send content, return 3-sentence summary.
- `POST /api/ai/tags` — Return 5 suggested tags as JSON array.
- `POST /api/ai/category` — Return predicted category (Work / Personal / Study / etc.).
- `POST /api/ai/rewrite` — Return rewritten version of the content.
- Add retry logic (max 3 retries on timeout).
- Add response caching (same content hash = return cached result, don't call AI again).

**3.2 Version Control (Backend)**
- `VersionController` + `VersionService`.
- `POST /api/versions/{docId}` — Create snapshot (label + full content copy).
- `GET /api/versions/{docId}` — List all versions (id, label, createdAt, createdBy).
- `GET /api/versions/{id}` — Get single version content (for preview).
- `POST /api/versions/{id}/restore` — Copy version content back to document (creates a new version "Before restore" automatically).

**3.3 Lock System (Backend)**
- `POST /api/docs/{id}/lock` — BCrypt hash password, set isLocked = true.
- `POST /api/docs/{id}/unlock` — Verify BCrypt, return session token.
- `DELETE /api/docs/{id}/lock` — Verify password, remove lock.
- Apply same endpoints for groups: `/api/groups/{id}/lock` etc.
- Rate limiting: track failed attempts in memory (or Redis), block after 5 failures for 60s.

**3.4 Collaboration + Sharing (Backend)**
- `ShareController` + `ShareService`.
- `POST /api/share/{docId}` — Create collaborator record, send email invitation.
- `GET /api/share/{docId}` — List collaborators with roles and view stats.
- `PUT /api/share/{docId}/{userId}` — Update role.
- `DELETE /api/share/{docId}/{userId}` — Remove collaborator.
- `POST /api/docs/{id}/public-link` — Generate shareToken, set visibility = PUBLIC.
- `DELETE /api/docs/{id}/public-link` — Revoke public link.
- `GET /api/docs/public/{shareToken}` — Public access (no auth required).
- Increment `viewCount` + set `viewedAt` on every document open for collaborators.

**3.5 AI UI Panel (Frontend)**
- AI sidebar panel component (right sidebar, toggleable).
- "AI Assist" button in the toolbar opens the panel.
- Panel shows: Summarize, Suggest Tags, Predict Category, Rewrite buttons.
- Loading spinner while AI responds.
- Results shown inline in the panel with "Apply" button (applies to the note).
- `/ai` slash command in editor → opens AI sub-menu.

**3.6 Version Timeline UI (Frontend)**
- "Versions" tab in the right sidebar.
- "Save Version" button with label input modal.
- Timeline list of all versions (label, date, author avatar).
- Click a version → preview panel shows old content in read-only view.
- "Restore" button with confirmation dialog ("This will replace current content").

**3.7 Share Modal UI (Frontend)**
- Share modal triggered from action menu or toolbar share button.
- Tab 1 — Invite: email input + role dropdown (Editor / Viewer) + "Invite" button.
- Collaborator list showing current collaborators with role badges and "Remove" button.
- Tab 2 — Public Link: toggle switch, copy-to-clipboard button, "Regenerate Link" button.
- View stats shown below: "Viewed 12 times by 3 people".

**3.8 Lock UI (Frontend)**
- "Lock" option in action menu → password setup modal.
- Lock screen component shown when opening a locked note (replaces editor).
- Password input with show/hide toggle.
- "Wrong password" inline error with attempt counter.
- "Unlock" persists in session memory (re-lock on tab close).
- Lock icon badge on note cards and group folders in sidebar.

**Deliverable at end of Step 3:**
- AI summarize, tag, rewrite all work from the editor.
- Version snapshots can be created and restored.
- Documents can be shared via email and public link with role control.
- Notes and groups can be locked with BCrypt passwords.

---

### ✅ Step 4 — Polish + Search + Export + UI Completion

**Goal:** The application is complete, polished, and ready for submission. Search works, export works, the UI is responsive with dark mode, and all edge cases are handled.

**What to build:**

**4.1 Search System (Frontend + Backend)**
- Backend: `GET /api/docs/search?q=` — JPA query searching title, tags, content (ILIKE for PostgreSQL).
- Frontend: `Cmd+K` (or `Ctrl+K`) opens the global command palette modal.
- Instant search as user types (debounced 300ms).
- Results show: note title, matching snippet, group breadcrumb, last edited date.
- Press `Enter` or click result → navigate to note.
- Filter chips: All / Notes / Groups / Archived.

**4.2 Favorites System (Frontend)**
- Star icon on every note card and group row.
- Click star → `POST /api/docs/{id}/favorite`.
- Favorites section in sidebar: `⭐ Favorites`.
- Favorites page shows all starred notes and groups in a grid.

**4.3 Reminders System (Frontend + Backend)**
- "Reminder" option in action menu → date/time picker modal.
- Backend: `POST /api/reminders` stores remindAt timestamp.
- Reminders list page (`/reminders`) showing all upcoming reminders.
- In-app notification bell icon — badge shows count of triggered reminders.
- Quick options: "Tomorrow", "Next Week", "Custom".

**4.4 Activity Log UI (Frontend)**
- Dashboard activity feed component shows last 20 events.
- Activity page (`/activity`) shows full timeline with filters.
- Filter by: All, My Actions, Shared with Me, Versions.
- Each event: icon + description + relative time ("2 hours ago").

**4.5 Export System (Backend + Frontend)**
- Backend: `GET /api/docs/{id}/export?type=pdf` — Convert Tiptap JSON to PDF using iText or Apache PDFBox.
- `GET /api/docs/{id}/export?type=md` — Convert Tiptap JSON to Markdown string.
- `GET /api/docs/{id}/export?type=txt` — Strip all formatting, return plain text.
- Frontend: "Download" option in action menu → opens format picker modal (PDF / MD / TXT).
- Progress indicator for PDF export (takes 1-3 seconds).

**4.6 Dark Mode (Frontend)**
- Install `next-themes`.
- Add `ThemeProvider` to root layout.
- Theme toggle button in the top navigation bar.
- Configure Tailwind `darkMode: 'class'`.
- Add custom dark CSS variables for Tiptap editor content.
- Test all components in both modes.

**4.7 Responsive Design (Frontend)**
- Mobile (< 768px): Sidebar becomes a bottom sheet drawer, accessible via hamburger icon.
- Tablet (768px–1024px): Sidebar collapses to icon-only mode.
- Desktop (> 1024px): Full sidebar always visible.
- Test all modals and the editor on mobile viewport.

**4.8 Toast Notifications (Frontend)**
- Install `react-hot-toast` or use shadcn/ui's `Sonner`.
- Success toasts: "Note created", "Note saved", "Link copied", "Version restored".
- Error toasts: "Failed to save — retrying...", "Wrong password".
- Loading toasts for AI requests: "AI is thinking..." → replaced by success/error.
- Undo toast for delete: 5-second countdown with "Undo" button.

**4.9 Loading Skeletons + Error States (Frontend)**
- Skeleton components for: note card grid, sidebar tree, editor loading, search results.
- Error boundary component for the editor — if editor crashes, show "Reload editor" fallback.
- Empty state illustrations for: empty group ("No notes yet"), empty bin ("Your bin is empty"), empty search ("No results for...").

**4.10 README + Submission Prep**
- `README.md` with: project description, feature list, setup instructions (both frontend and backend), environment variables table, API endpoint summary, screenshots of key pages.
- Environment variables needed: `DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, `FRONTEND_URL`.
- Test full end-to-end flow one final time.

**Deliverable at end of Step 4:**
- Complete, polished, fully functional application.
- All features working and tested.
- Dark mode and mobile responsive.
- README complete for submission.

---

## Summary Table

| Step | Focus | Key Deliverable |
|---|---|---|
| **Step 1** | Foundation — Auth + DB | Login works, all tables exist |
| **Step 2** | Core — Groups + Docs + Editor | Create, edit, autosave, move notes |
| **Step 3** | Advanced — AI + Versions + Share + Lock | AI tools, version history, sharing, passwords |
| **Step 4** | Polish — Search + Export + UI | Complete, responsive, submission-ready |

---

> *Each step builds on the previous. Never start Step 3 without Step 2's core working — advanced features on a broken foundation waste time.*