package lk.hemal.notly.service.impl;

import lk.hemal.notly.dto.request.LoginRequestDto;
import lk.hemal.notly.dto.request.RegisterRequestDto;
import lk.hemal.notly.dto.response.AuthResponseDto;
import lk.hemal.notly.entity.User;
import lk.hemal.notly.exception.ErrorCode;
import lk.hemal.notly.exception.NotlyException;
import lk.hemal.notly.mapper.UserMapper;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private  final UserRepo userRepo;
//    private final WorkspaceRepo workspaceRepo;
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
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .displayName(req.getDisplayName().isEmpty() ? req.getDisplayName() : req.getUsername())
                .build();

        user = userRepo.save(user);

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
            throw new NotlyException(ErrorCode.ACCOUNT_LOCKED);
        }

        User user = userRepo
                .findByEmailOrUsername(req.getEmailOrUsername())
                .orElseThrow(() -> new NotlyException(ErrorCode.INVALID_CREDENTIALS));

        log.info("[AUTH] Login: id={} email={}", user.getId(), user.getEmail());
        return buildAuthResponse(user);
    }


    // ── Private Helpers ────────────────────────────────────────

    private AuthResponseDto buildAuthResponse(User user) {
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new AuthResponseDto(accessToken, refreshToken, userMapper.toDto(user));
    }
}