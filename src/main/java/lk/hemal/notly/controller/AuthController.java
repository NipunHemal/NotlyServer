package lk.hemal.notly.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.dto.request.LoginRequestDto;
import lk.hemal.notly.dto.request.RegisterRequestDto;
import lk.hemal.notly.dto.response.AuthResponseDto;
import lk.hemal.notly.exception.ErrorResponse;
import lk.hemal.notly.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConfig.API_BASE_PATH + "/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration endpoints")
public class AuthController {

    private final AuthService authService;

    @Operation(
            summary = "Authenticate user",
            description = "Logs in a user with email/username and password, returning JWT access and refresh tokens."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = AuthResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials or account disabled/locked",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> authLogin(@Valid @RequestBody LoginRequestDto loginRequestDto) {
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }

    @Operation(
            summary = "Register new user",
            description = "Creates a new user account and returns JWT access and refresh tokens."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = AuthResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Username or email already exists",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto registerRequestDto) {
        return ResponseEntity.ok(authService.register(registerRequestDto));
    }
}
