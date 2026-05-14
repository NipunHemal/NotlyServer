package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.request.LoginRequestDto;
import lk.hemal.notly.dto.request.RefreshRequestDto;
import lk.hemal.notly.dto.request.RegisterRequestDto;
import lk.hemal.notly.dto.response.AuthResponseDto;
import lk.hemal.notly.entity.Group;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.entity.Workspace;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.mapper.UserMapper;
import lk.hemal.notly.repo.GroupRepo;
import lk.hemal.notly.repo.UserRepo;
import lk.hemal.notly.repo.WorkspaceRepo;
import lk.hemal.notly.service.AuthService;
import lk.hemal.notly.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepo userRepo;
    private final WorkspaceRepo workspaceRepo;
    private final GroupRepo groupRepo;
    private final JwtUtil jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;


    /**
     * new user register.
     * Steps:
     *   1) Email + username duplicate check
     *   2) Password BCrypt encode
     *   3) User + default Workspace save (@Transactional — atomic)
     *   4) JWT token pair issue
     */
    @Transactional
    public AuthResponseDto register(RegisterRequestDto req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new NotlyException(ErrorCode.USERNAME_ALREADY_EXISTS,
                    "Username '" + req.getUsername() + "' is already taken");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new NotlyException(ErrorCode.EMAIL_ALREADY_EXISTS,
                    "Email '" + req.getEmail() + "' is already registered");
        }

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .role(User.SystemRole.USER)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .displayName(req.getDisplayName().isEmpty() ? req.getUsername() : req.getDisplayName())
                .build();

        user = userRepo.save(user);

        Workspace workspace = new Workspace();
        workspace.setOwner(user);
        workspace.setName("My Workspace");
        workspace.setPublic(false);
        workspaceRepo.save(workspace);

        Group rootGroup = new Group();
        rootGroup.setWorkspace(workspace);
        rootGroup.setParent(null);
        rootGroup.setName("Workspace");
        rootGroup.setSortOrder(0);
        groupRepo.save(rootGroup);

        log.info("[AUTH] Workspace and root group created for user id={}", user.getId());

        return buildAuthResponse(user);
    }

    /**
     * Email/username + password login.
     * AuthenticationManager → DaoAuthenticationProvider → BCrypt verify.
     */
    public AuthResponseDto login(LoginRequestDto req) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getEmailOrUsername(), req.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new NotlyException(ErrorCode.INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            throw new NotlyException(ErrorCode.ACCOUNT_DISABLED);
        } catch (LockedException e) {
            e.printStackTrace();
            throw new NotlyException(ErrorCode.ACCOUNT_LOCKED);
        }

        User user = userRepo
                .findByEmailOrUsername(req.getEmailOrUsername())
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS));

        log.info("[AUTH] Login: id={} email={}", user.getId(), user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponseDto refresh(RefreshRequestDto req) {
        String refreshToken = req.getRefreshToken();

        if (!jwtService.isRefreshTokenValid(refreshToken)) {
            throw new NotlyException(ErrorCode.INVALID_CREDENTIALS, "Invalid or expired refresh token");
        }

        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));

        if (user.getCurrentRefreshToken() != null && !user.getCurrentRefreshToken().equals(refreshToken)) {
            throw new NotlyException(ErrorCode.INVALID_CREDENTIALS, "Refresh token has been revoked");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new NotlyException(ErrorCode.INVALID_CREDENTIALS, "Refresh token is required for logout");
        }

        if (!jwtService.isRefreshTokenValid(refreshToken)) {
            log.warn("[AUTH] Logout attempt with invalid token");
            return;
        }

        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepo.findById(UUID.fromString(userId))
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS, "User not found"));

        user.setCurrentRefreshToken(null);
        userRepo.save(user);
        log.info("[AUTH] Logout: id={} email={}", user.getId(), user.getEmail());
    }


    // ── Private Helpers ────────────────────────────────────────

    private AuthResponseDto buildAuthResponse(User user) {
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        user.setCurrentRefreshToken(refreshToken);
        userRepo.save(user);

        return new AuthResponseDto(accessToken, refreshToken, userMapper.toDto(user));
    }
}