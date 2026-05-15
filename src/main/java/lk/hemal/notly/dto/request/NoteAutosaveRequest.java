package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Autosave request optimized for debounced editor saves.
 * Lightweight DTO for high-frequency save operations.
 */
@Data
@Schema(description = "Note autosave request (debounce-friendly)")
public class NoteAutosaveRequest {

    @Schema(description = "Note title", example = "Meeting Notes")
    private String title;

    @NotNull(message = "Content is required")
    @Schema(description = "Editor content as Tiptap JSON object", example = "{\"type\":\"doc\",\"content\":[]}")
    private JsonNode contentJson;

    @Schema(description = "Client-side optimistic lock version", example = "5")
    private Long clientVersion;
}