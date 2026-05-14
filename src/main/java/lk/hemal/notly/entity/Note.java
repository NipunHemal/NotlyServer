package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "notes", indexes = {
        @Index(name = "idx_notes_group",   columnList = "group_id"),
        @Index(name = "idx_notes_owner",   columnList = "owner_id"),
        @Index(name = "idx_notes_status",  columnList = "status"),
        @Index(name = "idx_notes_deleted", columnList = "deleted_at")
})
@SQLRestriction("deleted_at IS NULL")   // soft-delete filter (active notes only)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE notes SET deleted_at = NOW() WHERE id = ?")
public class Note extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private NoteStatus status = NoteStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    private Visibility visibility = Visibility.PRIVATE;

    @Column(name = "is_locked", nullable = false)
    private boolean isLocked = false;

    @Column(name = "lock_password_hash", length = 255)
    private String lockPasswordHash;

    @Column(name = "is_favorite", nullable = false)
    private boolean isFavorite = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "share_token", unique = true, length = 64)
    private String shareToken;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    // ── Full-text search vector (managed by Postgres trigger) ──
    // Stored as tsvector in DB; not mapped in JPA — queried via native query.

    // ── Relations ──────────────────────────────────────────────

//    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
//    private List<NoteTag> tags;
//
//    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    @OrderBy("createdAt DESC")
//    private List<NoteVersion> versions;
//
//    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    private List<Collaborator> collaborators;
//
//    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    private List<Reminder> reminders;
//
//    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    private List<NoteMedia> mediaFiles;

    // ── Soft delete helper ─────────────────────────────────────

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.status = NoteStatus.DELETED;
    }

    public void restore() {
        this.deletedAt = null;
        this.status = NoteStatus.ACTIVE;
    }

    // ── Enums ──────────────────────────────────────────────────

    public enum NoteStatus {
        ACTIVE, ARCHIVED, DELETED
    }

    public enum Visibility {
        PRIVATE, SHARED, PUBLIC
    }
}