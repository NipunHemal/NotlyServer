package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Content is required")
    @Schema(description = "Editor content as Tiptap/JSON string", example = "{\"type\":\"doc\",\"content\":[]}")
    private String contentJson;

    @Schema(description = "Client-side optimistic lock version", example = "5")
    private Long clientVersion;
}