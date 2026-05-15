package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * Activity log statistics summary.
 * Provides aggregated counts of user actions.
 */
@Data
@Builder
@Schema(description = "Activity log statistics")
public class ActivityLogStatsResponse {

    @Schema(description = "Total number of activities", example = "42")
    private long totalActivities;

    @Schema(description = "Count per action type", example = "{\"CREATED\":10,\"UPDATED\":20,\"DELETED\":5}")
    private Map<String, Long> actionCounts;

    @Schema(description = "Most frequent action", example = "UPDATED")
    private String topAction;

    @Schema(description = "Activity count for today", example = "5")
    private long todayCount;

    @Schema(description = "Activity count for this week", example = "15")
    private long weekCount;
}
