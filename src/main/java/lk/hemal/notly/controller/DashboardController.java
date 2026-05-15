package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.response.DashboardRecentItemResponse;
import lk.hemal.notly.dto.response.DashboardStatsResponse;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard overview and statistics")
@SecurityRequirement(name = "BearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(
            summary = "Get dashboard statistics",
            description = "Returns aggregated counts and activity breakdown for the authenticated user's dashboard."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DashboardStatsResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getStats(user));
    }

    @Operation(
            summary = "Get recent dashboard feed",
            description = "Returns a unified feed of recent notes and activities for the dashboard, sorted by time."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feed retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DashboardRecentItemResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/recent")
    public ResponseEntity<List<DashboardRecentItemResponse>> getRecentFeed(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getRecentFeed(user));
    }
}
