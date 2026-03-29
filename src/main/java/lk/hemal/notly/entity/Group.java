package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;

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
public class Group extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    // Self-join for nested groups (infinite hierarchy)
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

    // ── Relations ──────────────────────────────────────────────

//    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    private List<Note> notes;
}
