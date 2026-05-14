package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.response.BinItemResponse;
import lk.hemal.notly.dto.response.RestoreResultResponse;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.service.BinService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/bin")
@RequiredArgsConstructor
@Tag(name = "Bin", description = "Recycle bin management endpoints")
public class BinController {

    private final BinService binService;

    @Operation(
            summary = "List bin items",
            description = "Returns all soft-deleted notes and groups for the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Bin items retrieved successfully",
                    content = @Content(schema = @Schema(implementation = BinItemResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<BinItemResponse>> getBinItems(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(binService.getBinItems(user));
    }

    @Operation(
            summary = "Restore bin item",
            description = "Restores a soft-deleted note or group. Fails if the 30-day restore window has expired."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item restored successfully",
                    content = @Content(schema = @Schema(implementation = RestoreResultResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bin item not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "410", description = "Restore window expired",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/restore")
    public ResponseEntity<RestoreResultResponse> restoreBinItem(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(binService.restoreBinItem(id, user));
    }

    @Operation(
            summary = "Permanently delete bin item",
            description = "Permanently deletes a note or group from the bin. This action cannot be undone."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Item permanently deleted"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bin item not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> permanentDeleteBinItem(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        binService.permanentDeleteBinItem(id, user);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Empty bin",
            description = "Permanently deletes all items in the user's bin. This action cannot be undone."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Bin emptied"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping
    public ResponseEntity<Void> emptyBin(
            @AuthenticationPrincipal User user) {
        binService.emptyBin(user);
        return ResponseEntity.noContent().build();
    }
}
