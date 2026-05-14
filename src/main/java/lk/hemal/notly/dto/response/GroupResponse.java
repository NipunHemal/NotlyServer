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
@Schema(description = "Group details response")
public class GroupResponse {

    @Schema(description = "Unique group identifier", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Group name", example = "Work Projects")
    private String name;

    @JsonProperty("parent_id")
    @Schema(description = "Parent group ID (null for root)", example = "550e8400-e29b-41d4-a716-446655440001")
    private UUID parentId;

    @JsonProperty("workspace_id")
    @Schema(description = "Workspace ID this group belongs to", example = "550e8400-e29b-41d4-a716-446655440002")
    private UUID workspaceId;

    @JsonProperty("sort_order")
    @Schema(description = "Sort order among siblings", example = "0")
    private int sortOrder;

    @JsonProperty("is_locked")
    @Schema(description = "Whether the group is password-locked", example = "false")
    private boolean locked;

    @JsonProperty("is_secure")
    @Schema(description = "Whether this is a secure vault group", example = "false")
    private boolean secure;

    @JsonProperty("is_favorite")
    @Schema(description = "Whether the group is favorited", example = "false")
    private boolean favorite;

    @JsonProperty("is_archived")
    @Schema(description = "Whether the group is archived", example = "false")
    private boolean archived;

    @Schema(description = "Visibility of the group", example = "PRIVATE")
    private String visibility;

    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime updatedAt;
}
