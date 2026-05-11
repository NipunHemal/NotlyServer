package lk.hemal.notly.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * The single custom runtime exception used throughout the Notly application.
 * It carries an {@link ErrorCode} that determines the HTTP status and error metadata,
 * eliminating the need for multiple individual exception subclasses.
 */
@Getter
public class NotlyException extends RuntimeException {

    private final ErrorCode errorCode;

    public NotlyException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public NotlyException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public NotlyException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
    }

    public NotlyException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return errorCode.getStatus();
    }
}
