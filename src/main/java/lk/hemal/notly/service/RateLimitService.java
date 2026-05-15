package lk.hemal.notly.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lk.hemal.notly.config.RateLimitProperties;
import lk.hemal.notly.config.RateLimitProperties.Tier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages token buckets for rate limiting.
 * Buckets are created on-demand and cached per client key.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private final RateLimitProperties properties;

    /** Cache of buckets per client key (IP + user + tier). */
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Resolves a bucket for the given client key and tier.
     * Creates a new bucket if one doesn't exist.
     */
    public Bucket resolveBucket(String key, Tier tier) {
        return buckets.computeIfAbsent(key, k -> createNewBucket(tier));
    }

    /**
     * Creates a token bucket for the given tier.
     */
    private Bucket createNewBucket(Tier tier) {
        Bandwidth bandwidth = Bandwidth.builder()
                .capacity(tier.getBurst())
                .refillIntervally(tier.getCapacity(), properties.getRefillPeriod())
                .build();
        return Bucket.builder().addLimit(bandwidth).build();
    }

    /**
     * Builds a rate limit key from request context.
     * For authenticated users: userId + tier
     * For anonymous: IP + tier
     */
    public String buildKey(String clientIdentifier, String tierName) {
        return clientIdentifier + ":" + tierName;
    }

    /**
     * Determines which tier a request path belongs to.
     * Checked in priority order: sensitive → heavy → public → api.
     */
    public String resolveTier(String path) {
        RateLimitProperties.PathTiers paths = properties.getPaths();

        if (matchesAny(path, paths.getSensitivePaths())) {
            return "sensitive";
        }
        if (matchesAny(path, paths.getHeavyPaths())) {
            return "heavy";
        }
        if (matchesAny(path, paths.getPublicPaths())) {
            return "public";
        }
        return "api";
    }

    /**
     * Returns the tier configuration for a given tier name.
     */
    public Tier getTierConfig(String tierName) {
        return switch (tierName) {
            case "public" -> properties.getPublicTier();
            case "heavy" -> properties.getHeavyTier();
            case "sensitive" -> properties.getSensitiveTier();
            default -> properties.getApiTier();
        };
    }

    private boolean matchesAny(String path, java.util.List<String> patterns) {
        return patterns.stream().anyMatch(path::startsWith);
    }
}
