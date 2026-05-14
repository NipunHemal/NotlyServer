package lk.hemal.notly.dto.response;

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
@Schema(description = "Group children response containing subgroups and notes")
public class GroupChildrenResponse {

    @Schema(description = "Direct child groups")
    private List<GroupResponse> groups;

    @Schema(description = "Notes in this group")
    private List<NoteSummaryResponse> notes;
}
