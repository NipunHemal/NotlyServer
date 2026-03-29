package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "friends",
        uniqueConstraints = @UniqueConstraint(
                name       = "uq_friendship",
                columnNames = {"user_id", "friend_id"}
        ),
        indexes = {
                @Index(name = "idx_friend_user",   columnList = "user_id"),
                @Index(name = "idx_friend_friend", columnList = "friend_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Friend {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "friend_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FriendStatus status = FriendStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum FriendStatus {
        PENDING, ACCEPTED, BLOCKED
    }
}
