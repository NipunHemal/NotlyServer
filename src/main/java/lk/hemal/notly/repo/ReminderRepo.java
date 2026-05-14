package lk.hemal.notly.repo;

import lk.hemal.notly.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReminderRepo extends JpaRepository<Reminder, UUID> {

    void deleteByNoteId(UUID noteId);
}
