package lk.hemal.notly.service;

import lk.hemal.notly.dto.request.SendEmailRequest;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.Note;
import lk.hemal.notly.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * High-level email notification service.
 * Wraps EmailService adapter to send business-specific emails.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final EmailService emailService;

    // ── Auth Flow Emails ───────────────────────────────────────

    public void sendWelcomeEmail(User user) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(user.getEmail())
                .subject("Welcome to Notly, " + user.getDisplayName() + "!")
                .textBody("Hi " + user.getDisplayName() + ",\n\nWelcome to Notly! Your account has been created successfully.\n\nHappy note-taking!\nThe Notly Team")
                .htmlBody(buildWelcomeHtml(user))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Welcome email sent to {}", user.getEmail());
    }

    public void sendLoginNotification(User user, String ipAddress, String device) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(user.getEmail())
                .subject("New login to your Notly account")
                .textBody("Hi " + user.getDisplayName() + ",\n\nWe detected a new login to your Notly account.\n\nIP: " + ipAddress + "\nDevice: " + device + "\n\nIf this wasn't you, please change your password immediately.")
                .htmlBody(buildLoginAlertHtml(user, ipAddress, device))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Login notification sent to {}", user.getEmail());
    }

    // ── Profile / Security Emails ──────────────────────────────

    public void sendPasswordChangedNotification(User user) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(user.getEmail())
                .subject("Your Notly password was changed")
                .textBody("Hi " + user.getDisplayName() + ",\n\nYour Notly account password was changed successfully.\n\nIf you didn't make this change, please contact support immediately.")
                .htmlBody(buildSecurityAlertHtml(user, "Password Changed", "Your password was changed successfully."))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Password change notification sent to {}", user.getEmail());
    }

    public void sendProfileUpdatedNotification(User user) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(user.getEmail())
                .subject("Your Notly profile was updated")
                .textBody("Hi " + user.getDisplayName() + ",\n\nYour Notly profile was updated.\n\nIf you didn't make this change, please contact support immediately.")
                .htmlBody(buildSecurityAlertHtml(user, "Profile Updated", "Your profile information was updated."))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Profile update notification sent to {}", user.getEmail());
    }

    public void sendAccountDeletedNotification(User user) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(user.getEmail())
                .subject("Your Notly account has been deactivated")
                .textBody("Hi " + user.getDisplayName() + ",\n\nYour Notly account has been deactivated. We're sorry to see you go.\n\nIf you change your mind, contact support within 30 days to restore your account.")
                .htmlBody(buildAccountDeletedHtml(user))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Account deletion notification sent to {}", user.getEmail());
    }

    // ── Collaboration Emails ───────────────────────────────────

    public void sendGroupShareInvitation(User owner, User target, Group group, String role) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(target.getEmail())
                .subject(owner.getDisplayName() + " shared a folder with you on Notly")
                .textBody("Hi " + target.getDisplayName() + ",\n\n" + owner.getDisplayName() + " (" + owner.getEmail() + ") shared the folder \"" + group.getName() + "\" with you as " + role + ".\n\nLog in to Notly to view it.")
                .htmlBody(buildShareInvitationHtml(owner, target, group.getName(), role, "folder"))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Group share invitation sent to {}", target.getEmail());
    }

    public void sendCollaboratorRoleChanged(User owner, User target, Group group, String newRole) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(target.getEmail())
                .subject("Your access to \"" + group.getName() + "\" was updated")
                .textBody("Hi " + target.getDisplayName() + ",\n\nYour role for the folder \"" + group.getName() + "\" was changed to " + newRole + " by " + owner.getDisplayName() + ".")
                .htmlBody(buildRoleChangeHtml(owner, target, group.getName(), newRole))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Collaborator role change notification sent to {}", target.getEmail());
    }

    public void sendCollaboratorRemoved(User owner, User target, Group group) {
        if (!emailService.isEnabled()) return;

        SendEmailRequest request = SendEmailRequest.builder()
                .to(target.getEmail())
                .subject("You were removed from \"" + group.getName() + "\"")
                .textBody("Hi " + target.getDisplayName() + ",\n\nYou were removed from the folder \"" + group.getName() + "\" by " + owner.getDisplayName() + ".")
                .htmlBody(buildRemovedHtml(owner, target, group.getName()))
                .build();

        emailService.sendEmail(request);
        log.info("[EMAIL] Collaborator removal notification sent to {}", target.getEmail());
    }

    // ── HTML Templates ─────────────────────────────────────────

    private String buildWelcomeHtml(User user) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Welcome to Notly!</h2>
                    <p>Hi %s,</p>
                    <p>Your account has been created successfully. We're excited to have you on board!</p>
                    <p>Start organizing your notes, ideas, and projects today.</p>
                    <p style="color: #7f8c8d; font-size: 12px;">The Notly Team</p>
                </div>
            </body>
            </html>
            """.formatted(user.getDisplayName());
    }

    private String buildLoginAlertHtml(User user, String ip, String device) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e67e22;">New Login Detected</h2>
                    <p>Hi %s,</p>
                    <p>We detected a new login to your Notly account:</p>
                    <ul>
                        <li><strong>IP Address:</strong> %s</li>
                        <li><strong>Device:</strong> %s</li>
                    </ul>
                    <p>If this wasn't you, please <a href="#" style="color: #e74c3c;">change your password immediately</a>.</p>
                </div>
            </body>
            </html>
            """.formatted(user.getDisplayName(), ip, device);
    }

    private String buildSecurityAlertHtml(User user, String title, String message) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #3498db;">%s</h2>
                    <p>Hi %s,</p>
                    <p>%s</p>
                    <p>If you didn't make this change, please contact support immediately.</p>
                </div>
            </body>
            </html>
            """.formatted(title, user.getDisplayName(), message);
    }

    private String buildAccountDeletedHtml(User user) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c;">Account Deactivated</h2>
                    <p>Hi %s,</p>
                    <p>Your Notly account has been deactivated. We're sorry to see you go.</p>
                    <p>If you change your mind, contact support within 30 days to restore your account.</p>
                </div>
            </body>
            </html>
            """.formatted(user.getDisplayName());
    }

    private String buildShareInvitationHtml(User owner, User target, String itemName, String role, String itemType) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">You've been invited!</h2>
                    <p>Hi %s,</p>
                    <p><strong>%s</strong> (%s) shared the %s <strong>"%s"</strong> with you as <strong>%s</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:3000" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Open Notly</a>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(target.getDisplayName(), owner.getDisplayName(), owner.getEmail(), itemType, itemName, role);
    }

    private String buildRoleChangeHtml(User owner, User target, String itemName, String newRole) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #f39c12;">Access Updated</h2>
                    <p>Hi %s,</p>
                    <p>Your role for the folder <strong>"%s"</strong> was changed to <strong>%s</strong> by %s.</p>
                </div>
            </body>
            </html>
            """.formatted(target.getDisplayName(), itemName, newRole, owner.getDisplayName());
    }

    private String buildRemovedHtml(User owner, User target, String itemName) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c;">Access Removed</h2>
                    <p>Hi %s,</p>
                    <p>You were removed from the folder <strong>"%s"</strong> by %s.</p>
                </div>
            </body>
            </html>
            """.formatted(target.getDisplayName(), itemName, owner.getDisplayName());
    }
}