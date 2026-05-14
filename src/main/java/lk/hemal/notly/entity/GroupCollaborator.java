package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_collaborators",
        uniqueConstraints = @UniqueConstraint(name = "uq_group_collab_group_user", columnNames = {"group_id", "user_id"}),
        indexes = {
                @Index(name = "idx_group_collab_group", columnList = "group_id"),
                @Index(name = "idx_group_collab_user", columnList = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role = Role.VIEWER;

    @Column(name = "invited_at", nullable = false, updatable = false)
    private LocalDateTime invitedAt = LocalDateTime.now();

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    public enum Role {
        OWNER, EDITOR, VIEWER
    }
}
