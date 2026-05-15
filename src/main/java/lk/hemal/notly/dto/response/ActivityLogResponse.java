package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Activity log entry response.
 * Represents a single user action on an entity.
 */
@Data
@Builder
@Schema(description = "Activity log entry")
public class ActivityLogResponse {

    @Schema(description = "Activity log ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Entity type", example = "NOTE")
    private String entityType;

    @Schema(description = "Entity ID", example = "550e8400-e29b-41d4-a716-446655440001")
    private UUID entityId;

    @Schema(description = "Action performed", example = "CREATED")
    private String action;

    @Schema(description = "Additional metadata", example = "{\"title\":\"Meeting Notes\"}")
    private Map<String, Object> metadata;

    @Schema(description = "When the activity occurred", example = "2025-01-15T10:30:00")
    private LocalDateTime createdAt;
}
