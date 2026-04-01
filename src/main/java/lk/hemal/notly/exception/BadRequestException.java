package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends NotlyException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
