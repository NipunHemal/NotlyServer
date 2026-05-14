package lk.hemal.notly.repo;

import lk.hemal.notly.entity.NoteTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NoteTagRepo extends JpaRepository<NoteTag, UUID> {

    void deleteByNoteId(UUID noteId);
}
