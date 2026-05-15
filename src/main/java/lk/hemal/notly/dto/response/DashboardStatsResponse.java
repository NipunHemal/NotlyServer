package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Dashboard overview statistics for the authenticated user.
 */
@Data
@Builder
@Schema(description = "Dashboard statistics overview")
public class DashboardStatsResponse {

    @Schema(description = "Total number of notes", example = "42")
    private long totalNotes;

    @Schema(description = "Total number of groups", example = "8")
    private long totalGroups;

    @Schema(description = "Total number of workspaces", example = "1")
    private long totalWorkspaces;

    @Schema(description = "Number of favorited notes", example = "5")
    private long favoriteNotes;

    @Schema(description = "Number of favorited groups", example = "2")
    private long favoriteGroups;

    @Schema(description = "Number of items in bin", example = "3")
    private long binItems;

    @Schema(description = "Number of archived notes", example = "4")
    private long archivedNotes;

    @Schema(description = "Number of locked notes", example = "2")
    private long lockedNotes;

    @Schema(description = "Number of public/shared notes", example = "6")
    private long sharedNotes;

    @Schema(description = "Activity counts per action", example = "{\"CREATED\":10,\"UPDATED\":20}")
    private Map<String, Long> activityBreakdown;

    @Schema(description = "Total activities recorded", example = "42")
    private long totalActivities;

    @Schema(description = "Activities today", example = "5")
    private long activitiesToday;

    @Schema(description = "Activities this week", example = "15")
    private long activitiesThisWeek;
}
