package lk.hemal.notly.repo;

import lk.hemal.notly.entity.NoteMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NoteMediaRepo extends JpaRepository<NoteMedia, UUID> {

    void deleteByNoteId(UUID noteId);
}
