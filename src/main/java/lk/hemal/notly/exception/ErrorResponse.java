package lk.hemal.notly.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

/**
 * Standardized error response payload returned by the API.
 * Follows RFC 7807 conventions by including type-like fields (code, status, message)
 * along with observability fields (timestamp, traceId) and optional field-level validation errors.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standardized error response payload following RFC 7807 conventions")
public class ErrorResponse {

    @Schema(description = "Machine-readable error code", example = "AUTH_001")
    private final String code;

    @Schema(description = "HTTP status code", example = "401")
    private final int status;

    @Schema(description = "Human-readable error description", example = "Invalid email or password")
    private final String message;

    @Schema(description = "UTC timestamp when the error occurred", example = "2024-01-15T10:30:00Z")
    private final Instant timestamp;

    @Schema(description = "Unique trace ID for log correlation (present on 500 errors)", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    private final String traceId;

    @Schema(description = "Validation field errors map (present on 400 validation errors)")
    private final Map<String, String> fieldErrors;
}
