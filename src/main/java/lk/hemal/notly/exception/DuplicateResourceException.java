package lk.hemal.notly.exception;

public class DuplicateResourceException extends ConflictException {
    public DuplicateResourceException(String resource, String field, String value) {
        super(String.format("%s already exists with %s: '%s'", resource, field, value));
    }
}
