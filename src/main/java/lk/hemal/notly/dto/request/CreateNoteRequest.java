package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Create a new note")
public class CreateNoteRequest {

    @NotNull(message = "Group ID is required")
    @JsonProperty("group_id")
    @Schema(description = "Target group ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID groupId;

    @Size(max = 500, message = "Title must be at most 500 characters")
    @Schema(description = "Note title (defaults to 'Untitled')", example = "Meeting Notes")
    private String title;

    @Schema(description = "Plain text content (backward compat)", example = "Hello world")
    private String content;

    @JsonProperty("content_json")
    @Schema(description = "Rich editor content as Tiptap JSON object", example = "{\"type\":\"doc\",\"content\":[]}")
    private JsonNode contentJson;
}
