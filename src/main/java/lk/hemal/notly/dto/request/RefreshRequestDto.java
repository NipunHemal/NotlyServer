package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RefreshRequestDto {

    @JsonProperty("refresh_token")
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
