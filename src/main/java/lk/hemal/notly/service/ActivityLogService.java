package lk.hemal.notly.service;

import lk.hemal.notly.dto.response.ActivityLogResponse;
import lk.hemal.notly.dto.response.ActivityLogStatsResponse;
import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ActivityLogService {

    void log(UUID userId, ActivityLog.EntityType entityType, UUID entityId,
             ActivityLog.ActivityAction action, Map<String, Object> metadata);

    void deleteForEntity(ActivityLog.EntityType entityType, UUID entityId);

    /** Get paginated activity log for the current user. */
    Page<ActivityLogResponse> getMyActivities(User user, Pageable pageable);

    /** Get activities filtered by entity type. */
    Page<ActivityLogResponse> getMyActivitiesByEntityType(
            User user, ActivityLog.EntityType entityType, Pageable pageable);

    /** Get activities filtered by action. */
    Page<ActivityLogResponse> getMyActivitiesByAction(
            User user, ActivityLog.ActivityAction action, Pageable pageable);

    /** Get activities for a specific entity. */
    List<ActivityLogResponse> getEntityActivities(ActivityLog.EntityType entityType, UUID entityId);

    /** Get activities within a date range. */
    Page<ActivityLogResponse> getMyActivitiesInDateRange(
            User user, LocalDateTime from, LocalDateTime to, Pageable pageable);

    /** Get activity statistics summary for the current user. */
    ActivityLogStatsResponse getMyActivityStats(User user);
}
