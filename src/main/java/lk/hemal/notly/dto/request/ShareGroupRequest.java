package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lk.hemal.notly.entity.GroupCollaborator;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Share group with a user by email")
public class ShareGroupRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Schema(description = "Email of the user to share with", example = "user@example.com")
    private String email;

    @Schema(description = "Role to assign (EDITOR or VIEWER)", example = "VIEWER")
    private GroupCollaborator.Role role;
}
