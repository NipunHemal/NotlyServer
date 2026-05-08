package lk.hemal.notly.exception;

public class ResourceAlreadyExistException extends ConflictException {
    public ResourceAlreadyExistException(String resource, String field, String value) {
        super(String.format("%s is Already Exist %s: '%s'", resource, field, value));
    }
}
