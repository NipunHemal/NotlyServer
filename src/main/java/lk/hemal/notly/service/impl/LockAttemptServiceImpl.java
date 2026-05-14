package lk.hemal.notly.service.impl;

import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.service.LockAttemptService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class LockAttemptServiceImpl implements LockAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_SECONDS = 60;

    private record Attempt(int count, Instant blockedUntil) {}

    private final ConcurrentHashMap<String, Attempt> attemptMap = new ConcurrentHashMap<>();

    @Override
    public void assertNotBlocked(String key) {
        Attempt attempt = attemptMap.get(key);
        if (attempt != null && attempt.blockedUntil() != null && Instant.now().isBefore(attempt.blockedUntil())) {
            throw new NotlyException(ErrorCode.TOO_MANY_UNLOCK_ATTEMPTS);
        }
        if (attempt != null && attempt.blockedUntil() != null && Instant.now().isAfter(attempt.blockedUntil())) {
            attemptMap.remove(key);
        }
    }

    @Override
    public void recordFailure(String key) {
        Attempt current = attemptMap.getOrDefault(key, new Attempt(0, null));
        int newCount = current.count() + 1;

        Instant blockedUntil = null;
        if (newCount >= MAX_ATTEMPTS) {
            blockedUntil = Instant.now().plusSeconds(BLOCK_DURATION_SECONDS);
            log.warn("[LOCK] Blocked key={} for {} seconds after {} failures", key, BLOCK_DURATION_SECONDS, newCount);
        }

        attemptMap.put(key, new Attempt(newCount, blockedUntil));
    }

    @Override
    public void recordSuccess(String key) {
        attemptMap.remove(key);
        log.debug("[LOCK] Cleared attempt tracking for key={}", key);
    }
}
