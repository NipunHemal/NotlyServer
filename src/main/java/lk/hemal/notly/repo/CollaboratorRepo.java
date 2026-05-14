package lk.hemal.notly.repo;

import lk.hemal.notly.entity.Collaborator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CollaboratorRepo extends JpaRepository<Collaborator, UUID> {

    void deleteByNoteId(UUID noteId);
}
