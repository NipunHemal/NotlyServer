package lk.hemal.notly.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bin_items", indexes = {
        @Index(name = "idx_bin_owner",    columnList = "owner_id"),
        @Index(name = "idx_bin_deadline", columnList = "restore_deadline")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BinItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt = LocalDateTime.now();

    // 30 days after deletion — scheduled job purges after this
    @Column(name = "restore_deadline", nullable = false)
    private LocalDateTime restoreDeadline = LocalDateTime.now().plusDays(30);

    public enum EntityType {
        NOTE, GROUP
    }
}