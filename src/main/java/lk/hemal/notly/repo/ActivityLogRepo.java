package lk.hemal.notly.repo;

import lk.hemal.notly.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ActivityLogRepo extends JpaRepository<ActivityLog, UUID> {

    void deleteByEntityTypeAndEntityId(ActivityLog.EntityType entityType, UUID entityId);
}
