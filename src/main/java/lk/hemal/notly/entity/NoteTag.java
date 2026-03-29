package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

// ══════════════════════════════════════════════════════════════
// NoteTag  —  simple string tags per note
// ══════════════════════════════════════════════════════════════

@Entity
@Table(name = "note_tags", indexes = {
        @Index(name = "idx_tags_note", columnList = "note_id"),
        @Index(name = "idx_tags_tag",  columnList = "tag")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class NoteTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(name = "tag", nullable = false, length = 100)
    private String tag;
}