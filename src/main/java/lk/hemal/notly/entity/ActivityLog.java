package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "activity_log", indexes = {
        @Index(name = "idx_activity_user",      columnList = "user_id"),
        @Index(name = "idx_activity_entity",    columnList = "entity_type, entity_id"),
        @Index(name = "idx_activity_created",   columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private EntityType entityType;

    // UUID of the note/group/version that was acted on
    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 30)
    private ActivityAction action;

    // Flexible JSONB field for extra context (e.g. old title, version label)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum EntityType {
        NOTE, GROUP, VERSION, COLLABORATOR, WORKSPACE
    }

    public enum ActivityAction {
        CREATED, UPDATED, DELETED, RESTORED,
        SHARED, UNSHARED, LOCKED, UNLOCKED,
        VERSION_CREATED, VERSION_RESTORED,
        ARCHIVED, FAVORITED, VIEWED
    }
}