package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Move group to a new parent")
public class MoveGroupRequest {

    @JsonProperty("target_parent_id")
    @Schema(description = "New parent group ID (null for root level)", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID targetParentId;

    @JsonProperty("sort_order")
    @Schema(description = "New sort order (optional, auto-assigned if not provided)", example = "0")
    private Integer sortOrder;
}
