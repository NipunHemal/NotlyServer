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
@Schema(description = "Lock request with password")
public class LockRequest {

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 128, message = "Password must be between 6 and 128 characters")
    @Schema(description = "Password to lock the item", example = "securePass123")
    private String password;

    @JsonProperty("make_secure")
    @Schema(description = "For groups: whether to make it a secure vault", example = "false")
    private Boolean makeSecure;
}
