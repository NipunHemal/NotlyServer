package lk.hemal.notly.exception;

public class InvalidCredentialsException extends UnauthorizedException {
    public InvalidCredentialsException() {
        super("Invalid email/username or password");
    }
}
