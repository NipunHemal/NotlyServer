package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Restore result response")
public class RestoreResultResponse {

    @Schema(description = "Whether restoration was successful", example = "true")
    private boolean restored;

    @Schema(description = "Type of restored entity", example = "NOTE")
    private String type;

    @Schema(description = "ID of the restored entity", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;
}
