package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.response.FavoritesResponse;
import lk.hemal.notly.dto.response.GroupResponse;
import lk.hemal.notly.dto.response.NoteSummaryResponse;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.service.GroupService;
import lk.hemal.notly.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "Favorites aggregate endpoint")
public class FavoritesController {

    private final GroupService groupService;
    private final NoteService noteService;

    @Operation(
            summary = "Get all favorites",
            description = "Returns all favorited groups and notes for the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Favorites retrieved successfully",
                    content = @Content(schema = @Schema(implementation = FavoritesResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<FavoritesResponse> getFavorites(
            @AuthenticationPrincipal User user) {
        List<GroupResponse> groups = groupService.getFavoriteGroups(user);
        List<NoteSummaryResponse> notes = noteService.getNotesByFavorite(user);
        return ResponseEntity.ok(new FavoritesResponse(groups, notes));
    }
}
