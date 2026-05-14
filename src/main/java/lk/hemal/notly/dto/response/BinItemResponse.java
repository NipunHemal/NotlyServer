package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Bin item response")
public class BinItemResponse {

    @Schema(description = "Bin item ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @JsonProperty("entity_type")
    @Schema(description = "Type of deleted entity", example = "NOTE")
    private String entityType;

    @JsonProperty("entity_id")
    @Schema(description = "ID of the deleted entity", example = "550e8400-e29b-41d4-a716-446655440001")
    private UUID entityId;

    @Schema(description = "Title or name of the deleted entity", example = "Meeting Notes")
    private String title;

    @JsonProperty("deleted_at")
    @Schema(description = "Deletion timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime deletedAt;

    @JsonProperty("restore_deadline")
    @Schema(description = "Deadline for restoration (30 days after deletion)", example = "2024-02-14T10:30:00")
    private LocalDateTime restoreDeadline;

    @JsonProperty("days_left")
    @Schema(description = "Days remaining until permanent deletion", example = "25")
    private long daysLeft;

    @JsonProperty("original_group_id")
    @Schema(description = "Original group ID (for notes)", example = "550e8400-e29b-41d4-a716-446655440002")
    private UUID originalGroupId;
}
