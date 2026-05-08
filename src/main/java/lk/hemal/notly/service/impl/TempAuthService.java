//package lk.hemal.notly.service.impl;
//
//import com.notes.dto.auth.*;
//import com.notes.entity.User;
//import com.notes.entity.Workspace;
//import com.notes.exception.AuthException;
//import com.notes.repository.UserRepository;
//import com.notes.repository.WorkspaceRepository;
//import com.notes.security.JwtService;
//import com.notes.security.RedisTokenService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.authentication.*;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.UUID;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class AuthService {
//
//    private final UserRepository        userRepository;
//    private final WorkspaceRepository   workspaceRepository;
//    private final JwtService            jwtService;
//    private final RedisTokenService     redisTokenService;
//    private final PasswordEncoder       passwordEncoder;
//    private final AuthenticationManager authenticationManager;
//
//    @Value("${app.jwt.access-token-expiry:900000}")
//    private long accessTokenExpiry;
//
//    // ── Register ───────────────────────────────────────────────
//
//    /**
//     * නව user register.
//     * Steps:
//     *   1) Email + username duplicate check
//     *   2) Password BCrypt encode
//     *   3) User + default Workspace save (@Transactional — atomic)
//     *   4) JWT token pair issue
//     */
//    @Transactional
//    public AuthResponse register(RegisterRequest req) {
//
//        if (userRepository.existsByEmail(req.email().toLowerCase())) {
//            throw AuthException.emailAlreadyExists(req.email());
//        }
//        if (userRepository.existsByUsername(req.username())) {
//            throw AuthException.usernameAlreadyTaken(req.username());
//        }
//
//        User user = User.builder()
//                .username(req.username().toLowerCase())
//                .email(req.email().toLowerCase())
//                .passwordHash(passwordEncoder.encode(req.password()))
//                .displayName(resolveDisplayName(req.displayName(), req.username()))
//                .isActive(true)
//                .role(User.SystemRole.USER)
//                .build();
//
//        user = userRepository.save(user);
//        createDefaultWorkspace(user);
//
//        log.info("[AUTH] Registered: id={} email={}", user.getId(), user.getEmail());
//        return buildAuthResponse(user);
//    }
//
//    // ── Login ──────────────────────────────────────────────────
//
//    /**
//     * Email/username + password login.
//     * AuthenticationManager → DaoAuthenticationProvider → BCrypt verify.
//     */
//    @Transactional(readOnly = true)
//    public AuthResponse login(LoginRequest req) {
//        try {
//            authenticationManager.authenticate(
//                    new UsernamePasswordAuthenticationToken(
//                            req.identifier().toLowerCase(), req.password()
//                    )
//            );
//        } catch (BadCredentialsException e) {
//            throw AuthException.invalidCredentials();
//        } catch (DisabledException e) {
//            throw AuthException.accountDisabled();
//        } catch (LockedException e) {
//            throw AuthException.accountLocked();
//        }
//
//        User user = userRepository
//                .findByEmailOrUsername(req.identifier().toLowerCase())
//                .orElseThrow(AuthException::invalidCredentials);
//
//        log.info("[AUTH] Login: id={} email={}", user.getId(), user.getEmail());
//        return buildAuthResponse(user);
//    }
//
//    // ── Refresh Token ──────────────────────────────────────────
//
//    /**
//     * Token Rotation:
//     * 1) Validate signature + type
//     * 2) Redis stored token match
//     * 3) Old delete → new issue
//     *
//     * Reuse attack: Redis ගෙදි token නෑ = already rotated.
//     * → All sessions terminate + warn.
//     */
//    @Transactional
//    public AuthResponse refreshToken(RefreshTokenRequest req) {
//        String token = req.refreshToken();
//
//        if (!jwtService.isTokenValid(token) || !jwtService.isRefreshToken(token)) {
//            throw AuthException.invalidRefreshToken();
//        }
//
//        String userId = jwtService.extractUserId(token);
//
//        if (!redisTokenService.isRefreshTokenValid(userId, token)) {
//            redisTokenService.deleteRefreshToken(userId);
//            log.warn("[AUTH] Refresh token reuse detected! userId={}", userId);
//            throw AuthException.refreshTokenReuse();
//        }
//
//        User user = userRepository.findById(UUID.fromString(userId))
//                .orElseThrow(AuthException::invalidRefreshToken);
//
//        if (!user.isActive()) throw AuthException.accountDisabled();
//
//        redisTokenService.deleteRefreshToken(userId);
//
//        log.info("[AUTH] Token rotated: userId={}", userId);
//        return buildAuthResponse(user);
//    }
//
//    // ── Logout ─────────────────────────────────────────────────
//
//    /**
//     * Access token JTI → Redis blacklist (TTL = remaining expiry).
//     * Refresh token → Redis delete.
//     */
//    public void logout(String rawAccessToken, String userId) {
//        if (jwtService.isTokenValid(rawAccessToken)) {
//            String jti = jwtService.extractJti(rawAccessToken);
//            long   ttl = jwtService.getRemainingExpiry(rawAccessToken);
//            redisTokenService.blacklistToken(jti, ttl);
//        }
//        redisTokenService.deleteRefreshToken(userId);
//        log.info("[AUTH] Logout: userId={}", userId);
//    }
//
//    // ── Logout All Devices ─────────────────────────────────────
//
//    public void logoutAllDevices(String rawAccessToken, String userId) {
//        logout(rawAccessToken, userId);
//        log.info("[AUTH] All sessions cleared: userId={}", userId);
//    }
//
//    // ── Change Password ────────────────────────────────────────
//
//    /**
//     * 1) Current password BCrypt verify
//     * 2) New == confirm check
//     * 3) Not same as current check
//     * 4) Save new hash
//     * 5) Security: all sessions terminate
//     */
//    @Transactional
//    public void changePassword(ChangePasswordRequest req,
//                               User currentUser,
//                               String rawAccessToken) {
//        if (!passwordEncoder.matches(req.currentPassword(), currentUser.getPasswordHash())) {
//            throw AuthException.invalidCurrentPassword();
//        }
//        if (!req.newPassword().equals(req.confirmPassword())) {
//            throw new IllegalArgumentException("New passwords do not match");
//        }
//        if (passwordEncoder.matches(req.newPassword(), currentUser.getPasswordHash())) {
//            throw new IllegalArgumentException("New password must differ from current");
//        }
//
//        currentUser.setPasswordHash(passwordEncoder.encode(req.newPassword()));
//        userRepository.save(currentUser);
//
//        // Password change → all sessions terminate (security)
//        logoutAllDevices(rawAccessToken, currentUser.getId().toString());
//
//        log.info("[AUTH] Password changed: userId={}", currentUser.getId());
//    }
//
//    // ── Update Profile ─────────────────────────────────────────
//
//    @Transactional
//    public UserProfileResponse updateProfile(UpdateProfileRequest req, User currentUser) {
//        if (req.username() != null
//                && !req.username().equalsIgnoreCase(currentUser.getUsername())
//                && userRepository.existsByUsername(req.username().toLowerCase())) {
//            throw AuthException.usernameAlreadyTaken(req.username());
//        }
//        if (req.username()    != null) currentUser.setUsername(req.username().toLowerCase());
//        if (req.displayName() != null) currentUser.setDisplayName(req.displayName());
//
//        currentUser = userRepository.save(currentUser);
//        log.info("[AUTH] Profile updated: userId={}", currentUser.getId());
//        return toProfileResponse(currentUser);
//    }
//
//    // ── Get Profile ────────────────────────────────────────────
//
//    @Transactional(readOnly = true)
//    public UserProfileResponse getProfile(User currentUser) {
//        return toProfileResponse(currentUser);
//    }
//
//    // ── Private Helpers ────────────────────────────────────────
//
//    private AuthResponse buildAuthResponse(User user) {
//        String accessToken  = jwtService.generateAccessToken(user);
//        String refreshToken = jwtService.generateRefreshToken(user);
//
//        long refreshTtlMs = 7L * 24 * 60 * 60 * 1000;
//        redisTokenService.storeRefreshToken(
//                user.getId().toString(), refreshToken, refreshTtlMs
//        );
//
//        UserSummary summary = new UserSummary(
//                user.getId().toString(),
//                user.getUsername(),
//                user.getEmail(),
//                user.getDisplayName(),
//                user.getAvatarUrl(),
//                user.getRole().name()
//        );
//
//        return AuthResponse.of(accessToken, refreshToken, accessTokenExpiry / 1000, summary);
//    }
//
//    private void createDefaultWorkspace(User user) {
//        workspaceRepository.save(Workspace.builder()
//                .owner(user).name("My Workspace").isPublic(false).build());
//    }
//
//    private String resolveDisplayName(String displayName, String username) {
//        return (displayName != null && !displayName.isBlank()) ? displayName : username;
//    }
//
//    private UserProfileResponse toProfileResponse(User u) {
//        return new UserProfileResponse(
//                u.getId().toString(), u.getUsername(), u.getEmail(),
//                u.getDisplayName(), u.getAvatarUrl(), u.getRole().name(),
//                u.getOauthProvider() != null ? u.getOauthProvider().name() : null,
//                u.isActive(), u.getCreatedAt(), u.getUpdatedAt()
//        );
//    }
//}