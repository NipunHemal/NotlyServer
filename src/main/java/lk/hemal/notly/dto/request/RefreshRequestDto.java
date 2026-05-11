package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Token refresh request payload")
public class RefreshRequestDto {

    @JsonProperty("refresh_token")
    @NotBlank(message = "Refresh token is required")
    @Schema(description = "Valid refresh token issued during login or previous refresh", example = "eyJhbGciOiJIUzI1NiIs...")
    private String refreshToken;
}
