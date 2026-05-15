package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.response.ActivityLogResponse;
import lk.hemal.notly.dto.response.ActivityLogStatsResponse;
import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.repo.ActivityLogRepo;
import lk.hemal.notly.repo.UserRepo;
import lk.hemal.notly.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Override
    public Page<ActivityLogResponse> getMyActivities(User user, Pageable pageable) {
        return activityLogRepo.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<ActivityLogResponse> getMyActivitiesByEntityType(
            User user, ActivityLog.EntityType entityType, Pageable pageable) {
        return activityLogRepo.findByUserIdAndEntityTypeOrderByCreatedAtDesc(user.getId(), entityType, pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<ActivityLogResponse> getMyActivitiesByAction(
            User user, ActivityLog.ActivityAction action, Pageable pageable) {
        return activityLogRepo.findByUserIdAndActionOrderByCreatedAtDesc(user.getId(), action, pageable)
                .map(this::toResponse);
    }

    @Override
    public List<ActivityLogResponse> getEntityActivities(ActivityLog.EntityType entityType, UUID entityId) {
        return activityLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public Page<ActivityLogResponse> getMyActivitiesInDateRange(
            User user, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return activityLogRepo.findByUserIdAndDateRange(user.getId(), from, to, pageable)
                .map(this::toResponse);
    }

    @Override
    public ActivityLogStatsResponse getMyActivityStats(User user) {
        List<Object[]> counts = activityLogRepo.countByActionForUser(user.getId());

        Map<String, Long> actionCounts = counts.stream()
                .collect(Collectors.toMap(
                        row -> ((ActivityLog.ActivityAction) row[0]).name(),
                        row -> (Long) row[1]
                ));

        long total = actionCounts.values().stream().mapToLong(Long::longValue).sum();

        String topAction = actionCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayCount = activityLogRepo.findByUserIdAndDateRange(
                user.getId(), todayStart, LocalDateTime.now(), Pageable.unpaged()).getTotalElements();

        LocalDateTime weekStart = todayStart.minusDays(6);
        long weekCount = activityLogRepo.findByUserIdAndDateRange(
                user.getId(), weekStart, LocalDateTime.now(), Pageable.unpaged()).getTotalElements();

        return ActivityLogStatsResponse.builder()
                .totalActivities(total)
                .actionCounts(actionCounts)
                .topAction(topAction)
                .todayCount(todayCount)
                .weekCount(weekCount)
                .build();
    }

    private ActivityLogResponse toResponse(ActivityLog activityLog) {
        return ActivityLogResponse.builder()
                .id(activityLog.getId())
                .entityType(activityLog.getEntityType().name())
                .entityId(activityLog.getEntityId())
                .action(activityLog.getAction().name())
                .metadata(activityLog.getMetadata())
                .createdAt(activityLog.getCreatedAt())
                .build();
    }
}
