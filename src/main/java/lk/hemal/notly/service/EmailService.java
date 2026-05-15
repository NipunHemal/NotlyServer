package lk.hemal.notly.service;

import lk.hemal.notly.dto.request.SendEmailRequest;

/**
 * Email service adapter interface.
 * Implement this interface to plug in any email provider (Google SMTP, SendGrid, AWS SES, etc.)
 */
public interface EmailService {

    /**
     * Send a single email.
     *
     * @param request email details
     */
    void sendEmail(SendEmailRequest request);

    /**
     * Send a verification email with a token link.
     *
     * @param to recipient email
     * @param token verification token
     */
    void sendVerificationEmail(String to, String token);

    /**
     * Send a password reset email with a token link.
     *
     * @param to recipient email
     * @param token reset token
     */
    void sendPasswordResetEmail(String to, String token);

    /**
     * Check if email service is enabled.
     */
    boolean isEnabled();
}