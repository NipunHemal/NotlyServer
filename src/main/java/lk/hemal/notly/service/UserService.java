package lk.hemal.notly.service;

import lk.hemal.notly.dto.request.ChangePasswordRequest;
import lk.hemal.notly.dto.request.UpdateProfileRequest;
import lk.hemal.notly.dto.response.UserResponseDto;

import java.util.UUID;

public interface UserService {

    UserResponseDto getCurrentUser(UUID userId);

    UserResponseDto updateProfile(UUID userId, UpdateProfileRequest request);

    UserResponseDto getUserById(UUID userId);

    void changePassword(UUID userId, ChangePasswordRequest request);

    void deleteAccount(UUID userId);
}