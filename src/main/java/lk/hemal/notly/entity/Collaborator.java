package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "collaborators",
        uniqueConstraints = @UniqueConstraint(
                name  = "uq_collaborator_note_user",
                columnNames = {"note_id", "user_id"}
        ),
        indexes = {
                @Index(name = "idx_collab_note", columnList = "note_id"),
                @Index(name = "idx_collab_user", columnList = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class Collaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private CollaboratorRole role = CollaboratorRole.VIEWER;

    @Column(name = "invited_at", nullable = false, updatable = false)
    private LocalDateTime invitedAt = LocalDateTime.now();

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    public enum CollaboratorRole {
        OWNER, EDITOR, VIEWER
    }
}