package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends NotlyException {
    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
