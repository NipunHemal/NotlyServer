package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Public group response (read-only, no sensitive data)")
public class PublicGroupResponse {

    @Schema(description = "Group name", example = "Shared Projects")
    private String name;

    @JsonProperty("owner_name")
    @Schema(description = "Owner display name", example = "John Doe")
    private String ownerDisplayName;

    @Schema(description = "Notes in this group (read-only)")
    private List<PublicNoteResponse> notes;
}
