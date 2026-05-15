package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Note version snapshot response")
public class NoteVersionResponse {

    @Schema(description = "Version snapshot ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @JsonProperty("version_number")
    @Schema(description = "Version number", example = "3")
    private Long versionNumber;

    @Schema(description = "Title at this version", example = "Meeting Notes")
    private String title;

    @JsonProperty("content_json")
    @Schema(description = "Content snapshot (Tiptap JSON)", example = "{\"type\":\"doc\"}")
    private String contentJson;

    @JsonProperty("content_hash")
    @Schema(description = "Content SHA-256 hash", example = "a3f5c2...")
    private String contentHash;

    @JsonProperty("created_by")
    @Schema(description = "User who created this version")
    private VersionUser createdBy;

    @JsonProperty("change_summary")
    @Schema(description = "What changed", example = "autosave")
    private String changeSummary;

    @JsonProperty("created_at")
    @Schema(description = "Snapshot timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionUser {
        private UUID id;
        private String username;
        private String displayName;
    }
}