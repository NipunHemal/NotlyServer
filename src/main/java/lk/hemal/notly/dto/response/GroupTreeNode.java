package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Nested group tree node")
public class GroupTreeNode {

    @Schema(description = "Group ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Group name", example = "Work Projects")
    private String name;

    @JsonProperty("is_locked")
    @Schema(description = "Whether the group is locked", example = "false")
    private boolean locked;

    @JsonProperty("is_secure")
    @Schema(description = "Whether this is a secure vault", example = "false")
    private boolean secure;

    @JsonProperty("is_favorite")
    @Schema(description = "Whether favorited", example = "false")
    private boolean favorite;

    @JsonProperty("is_archived")
    @Schema(description = "Whether archived", example = "false")
    private boolean archived;

    @JsonProperty("sort_order")
    @Schema(description = "Sort order", example = "0")
    private int sortOrder;

    @Schema(description = "Child groups (recursive)")
    private List<GroupTreeNode> children;
}
