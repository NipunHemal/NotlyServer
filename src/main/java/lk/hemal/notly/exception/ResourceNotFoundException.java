package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends NotlyException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}