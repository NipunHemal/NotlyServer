package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A recent item appearing on the dashboard feed.
 * Can represent a note, group, or activity.
 */
@Data
@Builder
@Schema(description = "Recent dashboard item")
public class DashboardRecentItemResponse {

    @Schema(description = "Item ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Item type: NOTE, GROUP, ACTIVITY", example = "NOTE")
    private String type;

    @Schema(description = "Title or action label", example = "Meeting Notes")
    private String title;

    @Schema(description = "Subtitle or description", example = "Updated 2 hours ago")
    private String subtitle;

    @Schema(description = "Timestamp of the event", example = "2025-01-15T14:30:00")
    private LocalDateTime timestamp;

    @Schema(description = "Optional icon hint for frontend", example = "note")
    private String icon;
}
