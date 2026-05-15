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
@Schema(description = "Full note details response")
public class NoteResponse {

    @Schema(description = "Note ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @JsonProperty("group_id")
    @Schema(description = "Group ID", example = "550e8400-e29b-41d4-a716-446655440001")
    private UUID groupId;

    @JsonProperty("owner_id")
    @Schema(description = "Owner ID", example = "550e8400-e29b-41d4-a716-446655440002")
    private UUID ownerId;

    @JsonProperty("owner_name")
    @Schema(description = "Owner display name", example = "John Doe")
    private String ownerDisplayName;

    @Schema(description = "Note title", example = "Meeting Notes")
    private String title;

    @Schema(description = "Note content (Tiptap JSON or plain text)", example = "{\"type\":\"doc\",\"content\":[]}")
    private String content;

    @JsonProperty("content_json")
    @Schema(description = "Rich editor content (JSONB)", example = "{\"type\":\"doc\",\"content\":[]}")
    private String contentJson;

    @JsonProperty("version_number")
    @Schema(description = "Current version number", example = "5")
    private Long versionNumber;

    @JsonProperty("content_hash")
    @Schema(description = "Content SHA-256 hash", example = "a3f5c2...")
    private String contentHash;

    @JsonProperty("last_autosave_at")
    @Schema(description = "Last autosave timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime lastAutosaveAt;

    @Schema(description = "Note status", example = "ACTIVE")
    private String status;

    @Schema(description = "Note visibility", example = "PRIVATE")
    private String visibility;

    @JsonProperty("is_locked")
    @Schema(description = "Whether the note is locked", example = "false")
    private boolean locked;

    @JsonProperty("is_favorite")
    @Schema(description = "Whether favorited", example = "false")
    private boolean favorite;

    @JsonProperty("sort_order")
    @Schema(description = "Sort order", example = "0")
    private int sortOrder;

    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime updatedAt;
}
