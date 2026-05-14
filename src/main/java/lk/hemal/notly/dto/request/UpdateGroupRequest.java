package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Update group details (rename)")
public class UpdateGroupRequest {

    @Size(min = 1, max = 100, message = "Group name must be between 1 and 100 characters")
    @Schema(description = "New name for the group", example = "Updated Project Name")
    private String name;
}
