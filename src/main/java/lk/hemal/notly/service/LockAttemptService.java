package lk.hemal.notly.service;

public interface LockAttemptService {

    void assertNotBlocked(String key);

    void recordFailure(String key);

    void recordSuccess(String key);
}
