package lk.hemal.notly.dto.response;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AuthResponseDto {
    private String accessToken;
    private String refreshToken;
    private UserResponseDto user;
}
