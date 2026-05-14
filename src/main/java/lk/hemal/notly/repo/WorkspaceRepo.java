package lk.hemal.notly.repo;

import lk.hemal.notly.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepo extends JpaRepository<Workspace, UUID> {

    Optional<Workspace> findFirstByOwnerIdOrderByCreatedAtAsc(UUID ownerId);

    List<Workspace> findByOwnerId(UUID ownerId);
}
