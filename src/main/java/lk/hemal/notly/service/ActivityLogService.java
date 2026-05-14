package lk.hemal.notly.service;

import lk.hemal.notly.entity.ActivityLog;

import java.util.Map;
import java.util.UUID;

public interface ActivityLogService {

    void log(UUID userId, ActivityLog.EntityType entityType, UUID entityId,
             ActivityLog.ActivityAction action, Map<String, Object> metadata);

    void deleteForEntity(ActivityLog.EntityType entityType, UUID entityId);
}
