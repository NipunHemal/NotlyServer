package lk.hemal.notly.service;

import lk.hemal.notly.dto.request.LoginRequestDto;
import lk.hemal.notly.dto.request.RefreshRequestDto;
import lk.hemal.notly.dto.request.RegisterRequestDto;
import lk.hemal.notly.dto.response.AuthResponseDto;

public interface AuthService {

    AuthResponseDto register(RegisterRequestDto req);

    AuthResponseDto login(LoginRequestDto req);

    AuthResponseDto refresh(RefreshRequestDto req);

    void logout(String refreshToken);
}
