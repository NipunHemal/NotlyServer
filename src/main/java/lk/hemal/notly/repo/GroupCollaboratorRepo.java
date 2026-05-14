package lk.hemal.notly.repo;

import lk.hemal.notly.entity.GroupCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupCollaboratorRepo extends JpaRepository<GroupCollaborator, UUID> {

    List<GroupCollaborator> findByGroupId(UUID groupId);

    Optional<GroupCollaborator> findByGroupIdAndUserId(UUID groupId, UUID userId);

    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);

    void deleteByGroupId(UUID groupId);

    void deleteByGroupIdAndUserId(UUID groupId, UUID userId);
}
