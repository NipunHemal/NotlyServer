package lk.hemal.notly.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ApiResponseDto<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private String path;

    private ApiResponseDto(boolean success, String message, T data, LocalDateTime timestamp, String path) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = timestamp;
        this.path = path;
    }

    public static <T> ApiResponseDto<T> of(boolean success, String message, T data) {
        return new ApiResponseDto<>(success, message, data, LocalDateTime.now(), null);
    }

    public static <T> ApiResponseDto<T> success(T data) {
        return of(true, "Success", data);
    }

    public static <T> ApiResponseDto<T> success(String message, T data) {
        return of(true, message, data);
    }

    public static <T> ApiResponseDto<T> error(String message) {
        return of(false, message, null);
    }

    public static <T> ApiResponseDto<T> error(String message, T data) {
        return of(false, message, data);
    }

    public ApiResponseDto<T> path(String path) {
        this.path = path;
        return this;
    }
}
