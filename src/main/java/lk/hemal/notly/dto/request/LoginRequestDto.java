package lk.hemal.notly.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User login request payload")
public class LoginRequestDto {

    @NotBlank(message = "Email or username is required")
    @Schema(description = "Email address or username of the user", example = "john.doe@example.com")
    private String emailOrUsername;

    @NotBlank(message = "Password is required")
    @Schema(description = "User password", example = "Str0ngP@ss")
    private String password;
}
