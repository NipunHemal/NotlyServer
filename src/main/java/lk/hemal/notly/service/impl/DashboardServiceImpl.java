package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.response.DashboardRecentItemResponse;
import lk.hemal.notly.dto.response.DashboardStatsResponse;
import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.repo.ActivityLogRepo;
import lk.hemal.notly.repo.BinItemRepo;
import lk.hemal.notly.repo.GroupRepo;
import lk.hemal.notly.repo.NoteRepo;
import lk.hemal.notly.repo.WorkspaceRepo;
import lk.hemal.notly.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final NoteRepo noteRepo;
    private final GroupRepo groupRepo;
    private final WorkspaceRepo workspaceRepo;
    private final BinItemRepo binItemRepo;
    private final ActivityLogRepo activityLogRepo;

    @Override
    public DashboardStatsResponse getStats(User user) {
        long totalNotes = noteRepo.countByOwnerId(user.getId());
        long totalGroups = groupRepo.countByWorkspaceOwnerId(user.getId());
        long totalWorkspaces = workspaceRepo.countByOwnerId(user.getId());
        long favoriteNotes = noteRepo.countByOwnerIdAndIsFavoriteTrue(user.getId());
        long favoriteGroups = groupRepo.countByWorkspaceOwnerIdAndIsFavoriteTrue(user.getId());
        long binItems = binItemRepo.countByOwnerId(user.getId());
        long archivedNotes = noteRepo.countByOwnerIdAndStatus(user.getId(), Note.NoteStatus.ARCHIVED);

        long lockedNotes = noteRepo.findByOwnerIdAndStatus(user.getId(), Note.NoteStatus.ACTIVE)
                .stream().filter(Note::isLocked).count();

        long sharedNotes = noteRepo.findByOwnerIdAndStatus(user.getId(), Note.NoteStatus.ACTIVE)
                .stream().filter(n -> n.getVisibility() != Note.Visibility.PRIVATE).count();

        List<Object[]> actionCounts = activityLogRepo.countByActionForUser(user.getId());
        Map<String, Long> activityBreakdown = actionCounts.stream()
                .collect(Collectors.toMap(
                        row -> ((ActivityLog.ActivityAction) row[0]).name(),
                        row -> (Long) row[1]
                ));

        long totalActivities = activityBreakdown.values().stream().mapToLong(Long::longValue).sum();

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayCount = activityLogRepo.findByUserIdAndDateRange(
                user.getId(), todayStart, LocalDateTime.now(), Pageable.unpaged()).getTotalElements();

        LocalDateTime weekStart = todayStart.minusDays(6);
        long weekCount = activityLogRepo.findByUserIdAndDateRange(
                user.getId(), weekStart, LocalDateTime.now(), Pageable.unpaged()).getTotalElements();

        return DashboardStatsResponse.builder()
                .totalNotes(totalNotes)
                .totalGroups(totalGroups)
                .totalWorkspaces(totalWorkspaces)
                .favoriteNotes(favoriteNotes)
                .favoriteGroups(favoriteGroups)
                .binItems(binItems)
                .archivedNotes(archivedNotes)
                .lockedNotes(lockedNotes)
                .sharedNotes(sharedNotes)
                .activityBreakdown(activityBreakdown)
                .totalActivities(totalActivities)
                .activitiesToday(todayCount)
                .activitiesThisWeek(weekCount)
                .build();
    }

    @Override
    public List<DashboardRecentItemResponse> getRecentFeed(User user) {
        // Recent notes (by lastAutosaveAt or createdAt)
        List<DashboardRecentItemResponse> noteItems = noteRepo.findRecentByOwnerId(user.getId(), Pageable.ofSize(5))
                .stream().map(note -> DashboardRecentItemResponse.builder()
                        .id(note.getId())
                        .type("NOTE")
                        .title(note.getTitle())
                        .subtitle(note.getLastAutosaveAt() != null
                                ? "Edited " + formatRelative(note.getLastAutosaveAt())
                                : "Created " + formatRelative(note.getCreatedAt()))
                        .timestamp(note.getLastAutosaveAt() != null ? note.getLastAutosaveAt() : note.getCreatedAt())
                        .icon("note")
                        .build())
                .toList();

        // Recent activities
        List<DashboardRecentItemResponse> activityItems = activityLogRepo.findTop5ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(a -> DashboardRecentItemResponse.builder()
                        .id(a.getId())
                        .type("ACTIVITY")
                        .title(a.getAction().name())
                        .subtitle(a.getEntityType().name() + " — " + formatRelative(a.getCreatedAt()))
                        .timestamp(a.getCreatedAt())
                        .icon("activity")
                        .build())
                .toList();

        // Merge and sort by timestamp desc, take top 10
        return Stream.concat(noteItems.stream(), activityItems.stream())
                .sorted(Comparator.comparing(DashboardRecentItemResponse::getTimestamp).reversed())
                .limit(10)
                .toList();
    }

    private String formatRelative(LocalDateTime dt) {
        if (dt == null) return "";
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(dt, now).toMinutes();
        if (minutes < 1) return "just now";
        if (minutes < 60) return minutes + " min ago";
        long hours = minutes / 60;
        if (hours < 24) return hours + " hr ago";
        long days = hours / 24;
        if (days < 7) return days + " day ago";
        return dt.toLocalDate().toString();
    }
}
