package lk.hemal.notly.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Global exception handler that centralizes all error handling for the Notly API.
 * Produces RFC 7807-inspired {@link ErrorResponse} payloads for consistency and observability.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles all domain-specific business exceptions.
     */
    @ExceptionHandler(NotlyException.class)
    public ResponseEntity<ErrorResponse> handleNotlyException(NotlyException ex) {
        log.error("Business exception [{}]: {}", ex.getErrorCode().getCode(), ex.getMessage());

        ErrorCode errorCode = ex.getErrorCode();
        ErrorResponse response = ErrorResponse.builder()
                .code(errorCode.getCode())
                .status(errorCode.getStatus().value())
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .build();

        return new ResponseEntity<>(response, errorCode.getStatus());
    }

    /**
     * Handles validation errors triggered by {@code @Valid}.
     * Returns a structured map of field-specific error messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        log.error("Validation error: {}", ex.getMessage());

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage(),
                        (existing, replacement) -> existing
                ));

        ErrorResponse response = ErrorResponse.builder()
                .code(ErrorCode.VALIDATION_FAILED.getCode())
                .status(HttpStatus.BAD_REQUEST.value())
                .message(ErrorCode.VALIDATION_FAILED.getDefaultMessage())
                .timestamp(Instant.now())
                .fieldErrors(fieldErrors)
                .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Fallback handler for unexpected internal server errors.
     * Generates a UUID traceId to enable log correlation and observability.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Internal server error [traceId={}]: ", traceId, ex);

        ErrorResponse response = ErrorResponse.builder()
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message(ErrorCode.INTERNAL_SERVER_ERROR.getDefaultMessage())
                .timestamp(Instant.now())
                .traceId(traceId)
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
