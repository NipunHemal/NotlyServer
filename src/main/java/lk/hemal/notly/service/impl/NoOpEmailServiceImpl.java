package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.request.SendEmailRequest;
import lk.hemal.notly.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * No-op email service implementation.
 * Used when email is disabled (development mode).
 * Logs what would have been sent without actually sending.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "email.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpEmailServiceImpl implements EmailService {

    @Override
    public void sendEmail(SendEmailRequest request) {
        log.info("[EMAIL-NOOP] Would send to={} subject='{}' (email disabled)",
                request.getTo(), request.getSubject());
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        log.info("[EMAIL-NOOP] Would send verification email to={} token={} (email disabled)", to, token);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        log.info("[EMAIL-NOOP] Would send password reset email to={} token={} (email disabled)", to, token);
    }

    @Override
    public boolean isEnabled() {
        return false;
    }
}