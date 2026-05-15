package lk.hemal.notly.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lk.hemal.notly.config.RateLimitProperties;
import lk.hemal.notly.config.RateLimitProperties.Tier;
import lk.hemal.notly.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

/**
 * Rate limiting filter applied before authentication.
 * Uses token bucket algorithm per client (IP or user ID).
 * Adds standard rate limit headers to every response.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip rate limiting for Swagger, health checks, and OPTIONS
        String path = request.getRequestURI();
        if (shouldSkip(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String tierName = rateLimitService.resolveTier(path);
        Tier tier = rateLimitService.getTierConfig(tierName);
        String clientId = resolveClientIdentifier(request);
        String key = rateLimitService.buildKey(clientId, tierName);
        Bucket bucket = rateLimitService.resolveBucket(key, tier);

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        // Always add rate limit headers
        addRateLimitHeaders(response, probe, tier);

        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            sendRateLimitExceeded(response, waitSeconds);
            log.warn("[RATE_LIMIT] Blocked {} on {} (tier={}) — retry after {}s", clientId, path, tierName, waitSeconds);
        }
    }

    private String resolveClientIdentifier(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "user:" + auth.getName();
        }
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return "ip:" + ip.split(",")[0].trim();
    }

    private boolean shouldSkip(String path) {
        return path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/actuator/health")
                || path.equals("/")
                || path.equals("/test");
    }

    private void addRateLimitHeaders(HttpServletResponse response, ConsumptionProbe probe, Tier tier) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(tier.getCapacity()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
        if (!probe.isConsumed()) {
            long retryAfter = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.setHeader("X-RateLimit-Retry-After", String.valueOf(retryAfter));
        }
    }

    private void sendRateLimitExceeded(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = Map.of(
                "success", false,
                "code", "RAT_001",
                "status", 429,
                "message", "Rate limit exceeded. Please try again in " + retryAfterSeconds + " seconds.",
                "retryAfter", retryAfterSeconds,
                "timestamp", Instant.now().toString()
        );

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
