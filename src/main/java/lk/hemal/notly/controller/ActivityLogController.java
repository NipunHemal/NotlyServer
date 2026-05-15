package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.response.ActivityLogResponse;
import lk.hemal.notly.dto.response.ActivityLogStatsResponse;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.entity.ActivityLog;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/activities")
@RequiredArgsConstructor
@Tag(name = "Activity Log", description = "User activity history and audit trail")
@SecurityRequirement(name = "BearerAuth")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @Operation(
            summary = "Get my activities",
            description = "Returns paginated activity log for the authenticated user, newest first."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<Page<ActivityLogResponse>> getMyActivities(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(activityLogService.getMyActivities(user, pageable));
    }

    @Operation(
            summary = "Get my activities by entity type",
            description = "Filter activities by entity type: NOTE, GROUP, VERSION, COLLABORATOR, WORKSPACE."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid entity type",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me/entity/{entityType}")
    public ResponseEntity<Page<ActivityLogResponse>> getMyActivitiesByEntityType(
            @AuthenticationPrincipal User user,
            @Parameter(description = "Entity type", example = "NOTE")
            @PathVariable String entityType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        ActivityLog.EntityType type = ActivityLog.EntityType.valueOf(entityType.toUpperCase());
        return ResponseEntity.ok(activityLogService.getMyActivitiesByEntityType(user, type, pageable));
    }

    @Operation(
            summary = "Get my activities by action",
            description = "Filter activities by action: CREATED, UPDATED, DELETED, RESTORED, SHARED, UNSHARED, LOCKED, UNLOCKED, VERSION_CREATED, VERSION_RESTORED, ARCHIVED, FAVORITED, VIEWED."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid action",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me/action/{action}")
    public ResponseEntity<Page<ActivityLogResponse>> getMyActivitiesByAction(
            @AuthenticationPrincipal User user,
            @Parameter(description = "Action type", example = "CREATED")
            @PathVariable String action,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        ActivityLog.ActivityAction act = ActivityLog.ActivityAction.valueOf(action.toUpperCase());
        return ResponseEntity.ok(activityLogService.getMyActivitiesByAction(user, act, pageable));
    }

    @Operation(
            summary = "Get activities for a specific entity",
            description = "Returns the full audit trail for a single note or group."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Entity activities retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<ActivityLogResponse>> getEntityActivities(
            @Parameter(description = "Entity type", example = "NOTE")
            @PathVariable String entityType,
            @Parameter(description = "Entity ID", example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable UUID entityId) {
        ActivityLog.EntityType type = ActivityLog.EntityType.valueOf(entityType.toUpperCase());
        return ResponseEntity.ok(activityLogService.getEntityActivities(type, entityId));
    }

    @Operation(
            summary = "Get my activities in date range",
            description = "Filter activities between two ISO timestamps."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date range",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me/range")
    public ResponseEntity<Page<ActivityLogResponse>> getMyActivitiesInDateRange(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(activityLogService.getMyActivitiesInDateRange(user, from, to, pageable));
    }

    @Operation(
            summary = "Get my activity statistics",
            description = "Returns aggregated activity counts: total, per-action breakdown, today, this week, and top action."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me/stats")
    public ResponseEntity<ActivityLogStatsResponse> getMyActivityStats(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(activityLogService.getMyActivityStats(user));
    }
}
