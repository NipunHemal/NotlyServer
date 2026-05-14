package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.response.WorkspaceResponse;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/workspaces")
@RequiredArgsConstructor
@Tag(name = "Workspaces", description = "Workspace management endpoints")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @Operation(
            summary = "List user's workspaces",
            description = "Returns all workspaces owned by the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workspaces retrieved successfully",
                    content = @Content(schema = @Schema(implementation = WorkspaceResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<WorkspaceResponse>> listWorkspaces(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workspaceService.getWorkspacesByOwner(user));
    }

    @Operation(
            summary = "Get workspace by ID",
            description = "Returns a specific workspace owned by the authenticated user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Workspace retrieved successfully",
                    content = @Content(schema = @Schema(implementation = WorkspaceResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Workspace not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> getWorkspace(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workspaceService.getWorkspaceResponseById(id, user));
    }
}
