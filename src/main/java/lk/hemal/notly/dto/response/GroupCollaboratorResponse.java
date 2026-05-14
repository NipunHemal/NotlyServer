package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Group collaborator response")
public class GroupCollaboratorResponse {

    @Schema(description = "Collaborator ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Assigned role", example = "VIEWER")
    private String role;

    @JsonProperty("invited_at")
    @Schema(description = "Invitation timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime invitedAt;

    @Schema(description = "Collaborator user details")
    private UserResponseDto user;
}
