package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User registration request payload")
public class RegisterRequestDto {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Schema(description = "Unique username", example = "johndoe")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "Valid email address", example = "john.doe@example.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(description = "User password (min 6 characters)", example = "Str0ngP@ss")
    private String password;

    @JsonProperty("display_name")
    @Size(max = 100, message = "Display name must not exceed 100 characters")
    @Schema(description = "Display name shown in the UI", example = "John Doe")
    private String displayName;

    @JsonProperty("avatar_url")
    @Schema(description = "URL to user's avatar image", example = "https://example.com/avatar.png")
    private String avatarUrl;
}
