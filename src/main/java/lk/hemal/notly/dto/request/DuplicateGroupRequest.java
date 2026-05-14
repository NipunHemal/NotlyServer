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
@Schema(description = "Duplicate group request")
public class DuplicateGroupRequest {

    @JsonProperty("target_parent_id")
    @Schema(description = "Target parent for the duplicate (defaults to same parent)", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID targetParentId;
}
