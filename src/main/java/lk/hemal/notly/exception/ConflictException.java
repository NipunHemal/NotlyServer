package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends NotlyException {
    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
