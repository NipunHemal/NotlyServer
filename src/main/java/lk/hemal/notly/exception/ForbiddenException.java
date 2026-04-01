package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends NotlyException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
