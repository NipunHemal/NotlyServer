package lk.hemal.notly.service;

import lk.hemal.notly.dto.response.DashboardRecentItemResponse;
import lk.hemal.notly.dto.response.DashboardStatsResponse;
import lk.hemal.notly.entity.User;

import java.util.List;

public interface DashboardService {

    /** Get aggregated statistics for the user's dashboard. */
    DashboardStatsResponse getStats(User user);

    /** Get a unified recent-items feed for the dashboard. */
    List<DashboardRecentItemResponse> getRecentFeed(User user);
}
