package lk.hemal.notly.exception;

import org.springframework.http.HttpStatus;

public class AuthException extends NotlyException {
    public AuthException(String message, HttpStatus status) {
        super(message, status);
    }

    // --- Inner Static Exception Classes ---

    public static class EmailAlreadyExistsException extends AuthException {
        public EmailAlreadyExistsException(String email) {
            super("Email '" + email + "' is already registered", HttpStatus.CONFLICT);
        }
    }

    public static class UsernameAlreadyExistsException extends AuthException {
        public UsernameAlreadyExistsException(String username) {
            super("Username '" + username + "' is already taken",  HttpStatus.CONFLICT);
        }
    }

    public static class InvalidCredentialsException extends AuthException {
        public InvalidCredentialsException() {
            super("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }
    }

    public static class InvalidPasswordException extends AuthException {
        public InvalidPasswordException() {
            super("Invalid password", HttpStatus.UNAUTHORIZED);
        }
    }

    public static class InvalidUsernameException extends AuthException {
        public InvalidUsernameException() {
            super("Invalid username", HttpStatus.UNAUTHORIZED);
        }
    }

    public static class InvalidEmailException extends AuthException {
        public InvalidEmailException() {
            super("Invalid email", HttpStatus.UNAUTHORIZED);
        }
    }

    public static class AccountDisabledException extends AuthException {
        public AccountDisabledException() {
            super("Your account is disabled", HttpStatus.FORBIDDEN);
        }
    }

    public static class AccountLocked extends AuthException {
        public AccountLocked() {
            super("Your account is locked", HttpStatus.FORBIDDEN);
        }
    }
}