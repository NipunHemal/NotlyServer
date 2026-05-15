package lk.hemal.notly.util;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Content hashing utility for deduplication and integrity checks.
 * Uses SHA-256 for fast, collision-resistant content fingerprinting.
 */
@Slf4j
public final class ContentHashUtil {

    private ContentHashUtil() {}

    /**
     * Computes SHA-256 hex hash of the given string content.
     *
     * @param content the content to hash
     * @return 64-character hex hash, or null if content is null
     */
    public static String hash(String content) {
        if (content == null || content.isBlank()) {
            return hashOfEmpty();
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("[HASH] SHA-256 algorithm not available", e);
            throw new RuntimeException("Hashing algorithm not available", e);
        }
    }

    /**
     * Fast equality check using precomputed hashes.
     * Avoids string comparison for large content.
     */
    public static boolean isSameContent(String hashA, String hashB) {
        if (hashA == null || hashB == null) return false;
        return hashA.equals(hashB);
    }

    private static String hashOfEmpty() {
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}