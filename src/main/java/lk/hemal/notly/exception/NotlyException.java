package lk.hemal.notly.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class NotlyException extends RuntimeException {
    private final HttpStatus status;

    public NotlyException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
