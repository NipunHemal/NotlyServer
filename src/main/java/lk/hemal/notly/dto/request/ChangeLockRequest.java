package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Change lock password request")
public class ChangeLockRequest {

    @NotBlank(message = "Current password is required")
    @JsonProperty("current_password")
    @Schema(description = "Current password", example = "oldPass123")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 128, message = "New password must be between 6 and 128 characters")
    @JsonProperty("new_password")
    @Schema(description = "New password", example = "newPass456")
    private String newPassword;
}
