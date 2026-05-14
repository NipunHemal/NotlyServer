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
@Schema(description = "Favorites response containing favorited groups and notes")
public class FavoritesResponse {

    @Schema(description = "Favorited groups")
    private List<GroupResponse> groups;

    @Schema(description = "Favorited notes")
    private List<NoteSummaryResponse> notes;
}
