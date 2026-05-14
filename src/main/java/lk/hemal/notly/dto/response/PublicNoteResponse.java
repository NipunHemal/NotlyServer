package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Public note response (read-only, no sensitive data)")
public class PublicNoteResponse {

    @Schema(description = "Note title", example = "Meeting Notes")
    private String title;

    @Schema(description = "Note content", example = "{\"type\":\"doc\",\"content\":[]}")
    private String content;

    @JsonProperty("owner_name")
    @Schema(description = "Owner display name", example = "John Doe")
    private String ownerDisplayName;

    @JsonProperty("owner_avatar_url")
    @Schema(description = "Owner avatar URL", example = "https://example.com/avatar.png")
    private String ownerAvatarUrl;

    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime updatedAt;
}
