package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Snapshot-based note version history.
 * Each meaningful change creates an immutable snapshot for recovery and audit.
 */
@Entity
@Table(name = "note_versions", indexes = {
        @Index(name = "idx_nv_note_id", columnList = "note_id"),
        @Index(name = "idx_nv_note_ver", columnList = "note_id, version_number DESC"),
        @Index(name = "idx_nv_note_hash", columnList = "note_id, content_hash")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(name = "version_number", nullable = false)
    private Long versionNumber;

    @Column(name = "title", length = 500)
    private String title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_json")
    private String contentJson;

    @Column(name = "content_hash", length = 64, nullable = false)
    private String contentHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "change_summary", length = 255)
    private String changeSummary;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}