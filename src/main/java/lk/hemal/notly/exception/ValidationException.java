package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends NotlyException {
    public ValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
