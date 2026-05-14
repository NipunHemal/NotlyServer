package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.request.ChangePasswordRequest;
import lk.hemal.notly.dto.request.UpdateProfileRequest;
import lk.hemal.notly.dto.response.UserResponseDto;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.mapper.UserMapper;
import lk.hemal.notly.repo.UserRepo;
import lk.hemal.notly.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepo userRepo;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponseDto getCurrentUser(UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));
        return userMapper.toDto(user);
    }

    @Transactional
    @Override
    public UserResponseDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!request.getUsername().equals(user.getUsername()) && userRepo.existsByUsername(request.getUsername())) {
                throw new NotlyException(ErrorCode.USERNAME_ALREADY_EXISTS,
                        "Username '" + request.getUsername() + "' is already taken");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        user = userRepo.save(user);
        log.info("[USER] Profile updated: id={}", user.getId());
        return userMapper.toDto(user);
    }

    @Override
    public UserResponseDto getUserById(UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));
        return userMapper.toDto(user);
    }

    @Transactional
    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));

        if (user.getPasswordHash() == null) {
            throw new NotlyException(ErrorCode.INVALID_CREDENTIALS, "OAuth users cannot change password");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new NotlyException(ErrorCode.INVALID_CREDENTIALS, "Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);
        log.info("[USER] Password changed: id={}", user.getId());
    }

    @Transactional
    @Override
    public void deleteAccount(UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));

        user.setActive(false);
        user.setCurrentRefreshToken(null);
        userRepo.save(user);
        log.info("[USER] Account deactivated: id={}", user.getId());
    }
}