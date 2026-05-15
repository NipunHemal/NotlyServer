package lk.hemal.notly.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Rate limiting configuration properties.
 * Defines per-tier token bucket limits for different endpoint categories.
 */
@ConfigurationProperties(prefix = "rate-limit")
@Getter
@Setter
public class RateLimitProperties {

    /** Whether rate limiting is enabled globally. */
    private boolean enabled = true;

    /** Time window for rate limit refill. */
    private Duration refillPeriod = Duration.ofMinutes(1);

    /** Public tier: unauthenticated endpoints (login, register, public shares). */
    private Tier publicTier = new Tier(20, 30);

    /** API tier: standard authenticated CRUD operations. */
    private Tier apiTier = new Tier(100, 150);

    /** Heavy tier: search, export, bulk operations. */
    private Tier heavyTier = new Tier(10, 15);

    /** Sensitive tier: password change, account delete, etc. */
    private Tier sensitiveTier = new Tier(5, 8);

    /** Paths that map to each tier. Checked in order: sensitive → heavy → public → api. */
    private PathTiers paths = new PathTiers();

    @Getter
    @Setter
    public static class Tier {
        /** Tokens added per refill period. */
        private int capacity;
        /** Maximum burst size (initial tokens). */
        private int burst;

        public Tier() {}

        public Tier(int capacity, int burst) {
            this.capacity = capacity;
            this.burst = burst;
        }
    }

    @Getter
    @Setter
    public static class PathTiers {
        private List<String> publicPaths = List.of(
                "/api/v1/auth/",
                "/api/v1/notes/public/",
                "/api/v1/groups/public/",
                "/oauth2/",
                "/login/oauth2/"
        );

        private List<String> heavyPaths = List.of(
                "/api/v1/notes/search",
                "/api/v1/notes/export",
                "/api/v1/groups/search",
                "/api/v1/workspaces/search"
        );

        private List<String> sensitivePaths = List.of(
                "/api/v1/auth/change-password",
                "/api/v1/users/change-password",
                "/api/v1/users/delete-account",
                "/api/v1/users/me",
                "/api/v1/auth/forgot-password",
                "/api/v1/auth/reset-password"
        );
    }
}
