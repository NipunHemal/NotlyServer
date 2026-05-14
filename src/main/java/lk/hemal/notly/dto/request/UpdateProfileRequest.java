package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Update user profile request")
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Schema(description = "Unique username", example = "johndoe")
    private String username;

    @Size(max = 100, message = "Display name must not exceed 100 characters")
    @Schema(description = "Display name shown in the UI", example = "John Doe")
    private String displayName;

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    @Schema(description = "Avatar image URL", example = "https://example.com/avatar.png")
    private String avatarUrl;
}