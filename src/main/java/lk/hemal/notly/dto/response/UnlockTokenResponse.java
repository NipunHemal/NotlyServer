package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Unlock token response")
public class UnlockTokenResponse {

    @JsonProperty("unlock_token")
    @Schema(description = "Short-lived JWT unlock token", example = "eyJhbGciOiJIUzI1NiIs...")
    private String unlockToken;

    @JsonProperty("expires_in_seconds")
    @Schema(description = "Token expiry in seconds", example = "7200")
    private long expiresInSeconds;
}
