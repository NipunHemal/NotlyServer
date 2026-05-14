package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Unlock request with password")
public class UnlockRequest {

    @NotBlank(message = "Password is required")
    @Schema(description = "Password to unlock the item", example = "securePass123")
    private String password;
}
