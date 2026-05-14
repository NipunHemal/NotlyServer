package lk.hemal.notly.dto.response;

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
@Schema(description = "Group statistics")
public class GroupStatsResponse {

    @Schema(description = "Direct note count in this group", example = "5")
    private long directNoteCount;

    @Schema(description = "Direct subgroup count", example = "2")
    private long directSubgroupCount;

    @Schema(description = "Total note count including all descendants", example = "15")
    private long totalNoteCount;

    @Schema(description = "Last activity timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime lastActivityAt;
}
