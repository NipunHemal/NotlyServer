package lk.hemal.notly.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class ErrorResponse {

    private final String code;
    private final int status;
    private final String message;
    private final Instant timestamp;
    private final String traceId;
    private final Map<String, String> fieldErrors;
}
