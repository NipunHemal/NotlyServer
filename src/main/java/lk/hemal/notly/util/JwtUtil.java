package lk.hemal.notly.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lk.hemal.notly.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiry:900000}") // 15 min
    private long accessTokenExpiry;

    @Value("${jwt.refresh-token-expiry:604800000}") // 7 days
    private long refreshTokenExpiry;

    @Value("${jwt.unlock-token-expiry:7200000}") // 2 hours
    private long unlockTokenExpiry;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── Token Generation ───────────────────────────────────────

    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        claims.put("type", "ACCESS");

        return buildToken(claims, user.getId().toString(), accessTokenExpiry);
    }

    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "REFRESH");

        return buildToken(claims, user.getId().toString(), refreshTokenExpiry);
    }

    private String buildToken(Map<String, Object> claims, String subject, long expiry) {
        return Jwts.builder()
                .addClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiry))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Validation & Type Checks ────────────────────────────────

    public boolean isTokenValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        return "ACCESS".equals(extractClaim(token, "type"));
    }

    public boolean isRefreshToken(String token) {
        return "REFRESH".equals(extractClaim(token, "type"));
    }

    public boolean isRefreshTokenValid(String token) {
        return isTokenValid(token) && isRefreshToken(token);
    }

    // ── Unlock Token Methods ────────────────────────────────────

    public String generateUnlockToken(String userId, String entityType, String entityId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "UNLOCK");
        claims.put("ent", entityType);
        claims.put("eid", entityId);

        return buildToken(claims, userId, unlockTokenExpiry);
    }

    public boolean isUnlockTokenValid(String token, String userId, String entityType, String entityId) {
        try {
            Jws<Claims> jws = parseToken(token);
            Claims body = jws.getBody();
            boolean typeMatch = "UNLOCK".equals(body.get("type", String.class));
            boolean entMatch = entityType.equals(body.get("ent", String.class));
            boolean eidMatch = entityId.equals(body.get("eid", String.class));
            boolean subMatch = userId.equals(body.getSubject());
            return typeMatch && entMatch && eidMatch && subMatch;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid unlock token: {}", e.getMessage());
            return false;
        }
    }

    // ── Extraction Methods ──────────────────────────────────────

    // User ID (Subject) එක ගන්න
    public String extractUserId(String token) {
        return parseToken(token).getBody().getSubject();
    }

    // Email එක ගන්න
    public String extractEmail(String token) {
        return extractClaim(token, "email");
    }

    // Role එක ගන්න
    public String extractRole(String token) {
        return extractClaim(token, "role");
    }

    // සාමාන්‍යයෙන් ඕනෑම Claim එකක් ගන්න
    private String extractClaim(String token, String claimKey) {
//        return (String) parseToken(token).getPayload().get(claimKey);
        return parseToken(token).getBody().get(claimKey).toString();
    }

    private Jws<Claims> parseToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
    }
}