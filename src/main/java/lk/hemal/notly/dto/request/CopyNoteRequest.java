package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Copy note to a different group")
public class CopyNoteRequest {

    @NotNull(message = "Target group ID is required")
    @JsonProperty("target_group_id")
    @Schema(description = "Target group ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID targetGroupId;
}
