package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Create a new group (folder)")
public class CreateGroupRequest {

    @NotBlank(message = "Group name is required")
    @Size(min = 1, max = 100, message = "Group name must be between 1 and 100 characters")
    @Schema(description = "Name of the group", example = "Work Projects")
    private String name;

    @JsonProperty("parent_id")
    @Schema(description = "Parent group ID (null for root level)", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID parentId;

    @JsonProperty("is_secure")
    @Schema(description = "Whether this is a secure vault group", example = "false")
    private Boolean isSecure;

    @Size(min = 6, max = 128, message = "Password must be between 6 and 128 characters")
    @Schema(description = "Password for locking the group (required if is_secure=true)", example = "securePass123")
    private String password;
}
