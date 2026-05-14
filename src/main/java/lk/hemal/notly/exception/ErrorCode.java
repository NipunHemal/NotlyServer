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

    // Workspace / Group / Note resources
    WORKSPACE_NOT_FOUND("WS_001", HttpStatus.NOT_FOUND, "Workspace not found"),
    GROUP_NOT_FOUND("GRP_001", HttpStatus.NOT_FOUND, "Group not found"),
    NOTE_NOT_FOUND("NOTE_001", HttpStatus.NOT_FOUND, "Note not found"),
    CIRCULAR_GROUP_REFERENCE("GRP_002", HttpStatus.BAD_REQUEST, "Cannot move a group into itself or one of its descendants"),
    ROOT_GROUP_PROTECTED("GRP_003", HttpStatus.BAD_REQUEST, "The root group cannot be moved, deleted, or archived"),

    // Lock / secure
    INVALID_LOCK_PASSWORD("LOCK_001", HttpStatus.UNAUTHORIZED, "Incorrect password"),
    ITEM_NOT_LOCKED("LOCK_002", HttpStatus.BAD_REQUEST, "This item is not locked"),
    ITEM_ALREADY_LOCKED("LOCK_003", HttpStatus.CONFLICT, "This item is already locked"),
    TOO_MANY_UNLOCK_ATTEMPTS("LOCK_004", HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 60 seconds"),
    ITEM_LOCKED("LOCK_005", HttpStatus.FORBIDDEN, "This item is locked. Unlock it first"),
    INVALID_UNLOCK_TOKEN("LOCK_006", HttpStatus.FORBIDDEN, "Missing or invalid unlock token"),

    // Sharing
    INVALID_SHARE_TOKEN("SHR_001", HttpStatus.NOT_FOUND, "Invalid or revoked share link"),
    SHARE_TARGET_NOT_FOUND("SHR_002", HttpStatus.NOT_FOUND, "No registered user with that email"),
    CANNOT_SHARE_WITH_SELF("SHR_003", HttpStatus.BAD_REQUEST, "You cannot share an item with yourself"),
    ALREADY_SHARED("SHR_004", HttpStatus.CONFLICT, "Already shared with this user"),
    COLLABORATOR_NOT_FOUND("SHR_005", HttpStatus.NOT_FOUND, "Collaborator not found"),

    // Bin
    BIN_ITEM_NOT_FOUND("BIN_001", HttpStatus.NOT_FOUND, "Item not found in bin"),
    BIN_RESTORE_EXPIRED("BIN_002", HttpStatus.GONE, "This item's 30-day restore window has expired"),

    // Internal Errors
    INTERNAL_SERVER_ERROR("INT_001", HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");

    private final String code;
    private final HttpStatus status;
    private final String defaultMessage;
}
