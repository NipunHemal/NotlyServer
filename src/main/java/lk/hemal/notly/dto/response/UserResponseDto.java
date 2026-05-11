package lk.hemal.notly.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lk.hemal.notly.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User details response")
public class UserResponseDto {

    @Schema(description = "Unique user identifier", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Unique username", example = "johndoe")
    private String username;

    @Schema(description = "User email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Avatar image URL", example = "https://example.com/avatar.png")
    private String avatarUrl;

    @Schema(description = "Display name shown in the UI", example = "John Doe")
    private String displayName;

    @Schema(description = "Whether the email has been verified", example = "false")
    private boolean isEmailVerified;

    @Schema(description = "System role assigned to the user", example = "USER")
    private User.SystemRole role;

    @Schema(description = "Account creation timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Last account update timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime updatedAt;
}
