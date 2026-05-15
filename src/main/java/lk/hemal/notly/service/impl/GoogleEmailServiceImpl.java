package lk.hemal.notly.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lk.hemal.notly.config.EmailConfig;
import lk.hemal.notly.dto.request.SendEmailRequest;
import lk.hemal.notly.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "email.enabled", havingValue = "true")
public class GoogleEmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailConfig emailConfig;

    @Override
    public void sendEmail(SendEmailRequest request) {
        if (!isEnabled()) {
            log.warn("[EMAIL] Email service is disabled. Skipping send to {}", request.getTo());
            return;
        }

        try {
            if (request.getHtmlBody() != null && !request.getHtmlBody().isEmpty()) {
                sendHtmlEmail(request);
            } else {
                sendPlainEmail(request);
            }
            log.info("[EMAIL] Sent to={} subject='{}'", request.getTo(), request.getSubject());
        } catch (Exception e) {
            log.error("[EMAIL] Failed to send email to={} subject='{}'", request.getTo(), request.getSubject(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private void sendPlainEmail(SendEmailRequest request) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(emailConfig.getFrom());
        message.setTo(request.getTo());
        message.setSubject(request.getSubject());
        message.setText(request.getTextBody());
        mailSender.send(message);
    }

    private void sendHtmlEmail(SendEmailRequest request) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(emailConfig.getFrom());
        helper.setTo(request.getTo());
        helper.setSubject(request.getSubject());
        helper.setText(request.getTextBody(), request.getHtmlBody());
        mailSender.send(message);
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verificationLink = "http://localhost:3000/verify-email?token=" + token;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(to)
                .subject("Verify your Notly email address")
                .textBody("Please verify your email by clicking this link: " + verificationLink)
                .htmlBody(buildVerificationHtml(to, verificationLink))
                .build();

        sendEmail(request);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String resetLink = "http://localhost:3000/reset-password?token=" + token;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(to)
                .subject("Reset your Notly password")
                .textBody("Reset your password by clicking this link: " + resetLink + "\n\nThis link expires in 2 hours.")
                .htmlBody(buildPasswordResetHtml(to, resetLink))
                .build();

        sendEmail(request);
    }

    @Override
    public boolean isEnabled() {
        return emailConfig.isEnabled();
    }

    // ── HTML Templates ─────────────────────────────────────────

    private String buildVerificationHtml(String email, String link) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Verify Your Email</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up for <strong>Notly</strong>. Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #3498db;">%s</p>
                    <p style="color: #7f8c8d; font-size: 12px;">This link expires in 24 hours.</p>
                </div>
            </body>
            </html>
            """.formatted(link, link);
    }

    private String buildPasswordResetHtml(String email, String link) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Reset Your Password</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your <strong>Notly</strong> password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #e74c3c;">%s</p>
                    <p style="color: #7f8c8d; font-size: 12px;">This link expires in 2 hours. If you didn't request this, you can safely ignore this email.</p>
                </div>
            </body>
            </html>
            """.formatted(link, link);
    }
}