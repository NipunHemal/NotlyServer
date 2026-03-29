package lk.hemal.notly.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders", indexes = {
        @Index(name = "idx_reminder_user",       columnList = "user_id"),
        @Index(name = "idx_reminder_note",       columnList = "note_id"),
        @Index(name = "idx_reminder_remind_at",  columnList = "remind_at, is_sent")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reminder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(name = "remind_at", nullable = false)
    private LocalDateTime remindAt;

    @Column(name = "is_sent", nullable = false)
    private boolean isSent = false;
}