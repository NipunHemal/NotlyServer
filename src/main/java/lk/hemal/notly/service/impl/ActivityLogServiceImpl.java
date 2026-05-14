package lk.hemal.notly.service.impl;

import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.repo.ActivityLogRepo;
import lk.hemal.notly.repo.UserRepo;
import lk.hemal.notly.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepo activityLogRepo;
    private final UserRepo userRepo;

    @Override
    public void log(UUID userId, ActivityLog.EntityType entityType, UUID entityId,
                    ActivityLog.ActivityAction action, Map<String, Object> metadata) {
        try {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null) {
                log.warn("[ACTIVITY] Cannot log activity: user not found id={}", userId);
                return;
            }

            ActivityLog activityLog = new ActivityLog();
            activityLog.setUser(user);
            activityLog.setEntityType(entityType);
            activityLog.setEntityId(entityId);
            activityLog.setAction(action);
            activityLog.setMetadata(metadata);
            activityLogRepo.save(activityLog);
        } catch (Exception e) {
            log.warn("[ACTIVITY] Failed to log activity: {}", e.getMessage());
        }
    }

    @Override
    public void deleteForEntity(ActivityLog.EntityType entityType, UUID entityId) {
        try {
            activityLogRepo.deleteByEntityTypeAndEntityId(entityType, entityId);
        } catch (Exception e) {
            log.warn("[ACTIVITY] Failed to delete activity logs for entity: {}", e.getMessage());
        }
    }
}
