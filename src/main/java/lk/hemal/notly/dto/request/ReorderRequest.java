package lk.hemal.notly.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Reorder item within siblings")
public class ReorderRequest {

    @NotNull(message = "Sort order is required")
    @JsonProperty("sort_order")
    @Schema(description = "New sort order", example = "5")
    private Integer sortOrder;
}
