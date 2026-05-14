package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "groups", indexes = {
        @Index(name = "idx_groups_workspace", columnList = "workspace_id"),
        @Index(name = "idx_groups_parent",    columnList = "parent_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
@SQLDelete(sql = "UPDATE groups SET deleted_at = NOW() WHERE id = ?")
public class Group extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Group parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Group> children;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "is_locked", nullable = false)
    private boolean isLocked = false;

    @Column(name = "lock_password_hash", length = 255)
    private String lockPasswordHash;

    @Column(name = "is_archived", nullable = false)
    private boolean isArchived = false;

    @Column(name = "is_favorite", nullable = false)
    private boolean isFavorite = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    private Visibility visibility = Visibility.PRIVATE;

    @Column(name = "is_secure", nullable = false)
    private boolean isSecure = false;

    @Column(name = "share_token", unique = true, length = 64)
    private String shareToken;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
    }

    public enum Visibility {
        PRIVATE, SHARED, PUBLIC
    }
}
