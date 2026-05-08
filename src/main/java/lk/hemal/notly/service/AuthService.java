package lk.hemal.notly.service;

import lk.hemal.notly.dto.request.LoginRequestDto;
import lk.hemal.notly.dto.request.RegisterRequestDto;
import lk.hemal.notly.dto.response.AuthResponseDto;

public interface AuthService {

    /**
     * Registers a new user in the system.
     * * @param req the registration details (username, email, password)
     * @return AuthResponseDto containing tokens and user information
     */
    AuthResponseDto register(RegisterRequestDto req);

    /**
     * Authenticates a user based on email/username and password.
     * * @param req the login credentials
     * @return AuthResponseDto containing tokens and user information
     */
    AuthResponseDto login(LoginRequestDto req);
}
