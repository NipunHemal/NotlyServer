# Email Service Integration Guide

## Architecture

The email system uses an **adapter pattern** with a high-level notification service:

```
┌─────────────────────────┐
│ EmailNotificationService│  ← Business-specific emails (welcome, share, etc.)
│      (@Service)         │
└───────────┬─────────────┘
            │ uses
            ▼
┌─────────────────────────┐
│     EmailService        │  ← Adapter interface (provider-agnostic)
│      (interface)        │
└───────────┬─────────────┘
            │ implements
    ┌───────┴───────┬──────────────┐
    ▼               ▼              ▼
┌────────┐   ┌──────────┐   ┌──────────┐
│ Google │   │ SendGrid │   │   AWS    │
│  SMTP  │   │  (HTTP)  │   │   SES    │
│ (impl) │   │  (impl)  │   │  (impl)  │
└────────┘   └──────────┘   └──────────┘
```

## Email Flows Integrated

| Flow | Trigger | Email Sent |
|------|---------|------------|
| **Sign Up** | `POST /auth/register` | Welcome email |
| **Google Sign Up** | `POST /auth/google` (new user) | Welcome email |
| **Password Change** | `PUT /users/me/password` | Security notification |
| **Profile Update** | `PUT /users/me` | Security notification |
| **Account Delete** | `DELETE /users/me` | Deactivation confirmation |
| **Share Group** | `POST /groups/{id}/collaborators` | Invitation email to collaborator |
| **Update Role** | `PUT /groups/{id}/collaborators/{userId}` | Role change notification |
| **Remove Collaborator** | `DELETE /groups/{id}/collaborators/{userId}` | Access removed notification |

## How to Enable Email

1. Update `application.yml`:

```yaml
email:
  enabled: true
  provider: google
  from: "your-app@gmail.com"
  from-name: "Notly"
  smtp:
    host: smtp.gmail.com
    port: 587
    username: YOUR_GMAIL@gmail.com
    password: YOUR_APP_PASSWORD
    auth: true
    start-tls: true
```

2. For Gmail, generate an **App Password** at [Google Account Settings](https://myaccount.google.com/apppasswords)

3. Restart the server

## How to Add a New Provider

1. Create a new implementation of `EmailService`:

```java
@Service
@ConditionalOnProperty(name = "email.provider", havingValue = "sendgrid")
public class SendGridEmailServiceImpl implements EmailService {
    // implement all methods
}
```

2. Update `application.yml`:

```yaml
email:
  provider: sendgrid
```

## Disabling Email (Development)

Set `email.enabled: false` in `application.yml`. The `NoOpEmailServiceImpl` will be loaded instead, which logs what would have been sent without actually sending emails.

## Adding New Email Types

1. Add a method to `EmailNotificationService`
2. Call it from the relevant service (Auth, User, Group, etc.)

Example:

```java
// In EmailNotificationService
public void sendNewEmailType(User user, String data) {
    if (!emailService.isEnabled()) return;
    
    SendEmailRequest request = SendEmailRequest.builder()
        .to(user.getEmail())
        .subject("Subject")
        .textBody("Plain text")
        .htmlBody("<h1>HTML</h1>")
        .build();
    
    emailService.sendEmail(request);
}
```

Then call it:

```java
// In any service
emailNotificationService.sendNewEmailType(user, data);
```