package lk.hemal.notly.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    private String redirectUri;
}