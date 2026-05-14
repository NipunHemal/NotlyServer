package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Update note details (autosave - partial update)")
public class UpdateNoteRequest {

    @Size(max = 500, message = "Title must be at most 500 characters")
    @Schema(description = "New title", example = "Updated Meeting Notes")
    private String title;

    @Schema(description = "New content", example = "{\"type\":\"doc\",\"content\":[]}")
    private String content;
}
