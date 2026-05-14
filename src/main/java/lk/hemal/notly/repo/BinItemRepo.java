package lk.hemal.notly.repo;

import lk.hemal.notly.entity.BinItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BinItemRepo extends JpaRepository<BinItem, UUID> {

    List<BinItem> findByOwnerIdOrderByDeletedAtDesc(UUID ownerId);

    Optional<BinItem> findByOwnerIdAndEntityTypeAndEntityId(UUID ownerId, BinItem.EntityType type, UUID entityId);

    List<BinItem> findByRestoreDeadlineBefore(LocalDateTime cutoff);

    void deleteByEntityTypeAndEntityId(BinItem.EntityType type, UUID entityId);
}
