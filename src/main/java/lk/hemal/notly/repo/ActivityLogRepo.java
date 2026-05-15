package lk.hemal.notly.repo;

import lk.hemal.notly.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepo extends JpaRepository<ActivityLog, UUID> {

    void deleteByEntityTypeAndEntityId(ActivityLog.EntityType entityType, UUID entityId);

    /** Get paginated activity logs for a user, newest first. */
    Page<ActivityLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    /** Get activity logs for a user filtered by entity type. */
    Page<ActivityLog> findByUserIdAndEntityTypeOrderByCreatedAtDesc(
            UUID userId, ActivityLog.EntityType entityType, Pageable pageable);

    /** Get activity logs for a user filtered by action. */
    Page<ActivityLog> findByUserIdAndActionOrderByCreatedAtDesc(
            UUID userId, ActivityLog.ActivityAction action, Pageable pageable);

    /** Get activity logs for a specific entity. */
    List<ActivityLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            ActivityLog.EntityType entityType, UUID entityId);

    /** Get recent activity logs for a user within a date range. */
    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId AND a.createdAt BETWEEN :from AND :to ORDER BY a.createdAt DESC")
    Page<ActivityLog> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    /** Get activity summary counts per action for a user. */
    @Query("SELECT a.action, COUNT(a) FROM ActivityLog a WHERE a.user.id = :userId GROUP BY a.action")
    List<Object[]> countByActionForUser(@Param("userId") UUID userId);

    /** Get top N recent activities for a user. */
    List<ActivityLog> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);
}
