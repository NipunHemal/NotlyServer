package lk.hemal.notly.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * Centralized enumeration of all error codes in the Notly application.
 * Each constant defines a unique code, the associated HTTP status, and a default message.
 * This promotes consistency across the API and simplifies frontend error handling.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Request & Validation Errors
    VALIDATION_FAILED("VAL_001", HttpStatus.BAD_REQUEST, "Validation failed"),
    BAD_REQUEST("REQ_001", HttpStatus.BAD_REQUEST, "Bad request"),

    // Authentication & Authorization
    INVALID_CREDENTIALS("AUTH_001", HttpStatus.UNAUTHORIZED, "Invalid email or password"),
    UNAUTHORIZED("AUTH_002", HttpStatus.UNAUTHORIZED, "Unauthorized access"),
    ACCOUNT_DISABLED("AUTH_003", HttpStatus.FORBIDDEN, "Your account is disabled"),
    ACCOUNT_LOCKED("AUTH_004", HttpStatus.FORBIDDEN, "Your account is locked"),
    FORBIDDEN("AUTH_005", HttpStatus.FORBIDDEN, "Access denied"),

    // Resource Errors
    RESOURCE_NOT_FOUND("RES_001", HttpStatus.NOT_FOUND, "Resource not found"),
    EMAIL_ALREADY_EXISTS("RES_002", HttpStatus.CONFLICT, "Email is already registered"),
    USERNAME_ALREADY_EXISTS("RES_003", HttpStatus.CONFLICT, "Username is already taken"),
    RESOURCE_ALREADY_EXISTS("RES_004", HttpStatus.CONFLICT, "Resource already exists"),
    DUPLICATE_RESOURCE("RES_005", HttpStatus.CONFLICT, "Duplicate resource"),
    CONFLICT("RES_006", HttpStatus.CONFLICT, "Conflict occurred"),

    // Internal Errors
    INTERNAL_SERVER_ERROR("INT_001", HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");

    private final String code;
    private final HttpStatus status;
    private final String defaultMessage;
}
