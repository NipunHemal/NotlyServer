package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Schema(description = "Authentication response containing JWT tokens and user details")
public class AuthResponseDto {

    @Schema(description = "JWT access token for authenticated requests", example = "eyJhbGciOiJIUzI1NiIs...")
    private String accessToken;

    @Schema(description = "JWT refresh token for obtaining new access tokens", example = "eyJhbGciOiJIUzI1NiIs...")
    private String refreshToken;

    @Schema(description = "Authenticated user details")
    private UserResponseDto user;
}
