package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Email send request")
public class SendEmailRequest {

    @Schema(description = "Recipient email address", example = "user@example.com")
    private String to;

    @Schema(description = "Email subject", example = "Welcome to Notly")
    private String subject;

    @Schema(description = "Plain text body", example = "Hello, welcome to Notly!")
    private String textBody;

    @Schema(description = "HTML body (optional)", example = "<h1>Welcome</h1><p>Hello!</p>")
    private String htmlBody;
}