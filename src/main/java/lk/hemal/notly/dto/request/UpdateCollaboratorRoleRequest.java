package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lk.hemal.notly.entity.GroupCollaborator;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Update collaborator role")
public class UpdateCollaboratorRoleRequest {

    @NotNull(message = "Role is required")
    @Schema(description = "New role (EDITOR or VIEWER)", example = "EDITOR")
    private GroupCollaborator.Role role;
}
