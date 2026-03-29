package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "workspaces", indexes = {
        @Index(name = "idx_workspaces_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Workspace extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    // ── Relations ──────────────────────────────────────────────

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Group> groups;
}