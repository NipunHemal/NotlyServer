package lk.hemal.notly.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Share link response")
public class ShareLinkResponse {

    @JsonProperty("share_token")
    @Schema(description = "Share token for public access", example = "abc123-def456")
    private String shareToken;

    @JsonProperty("public_url_path")
    @Schema(description = "Public URL path", example = "/api/v1/notes/public/abc123-def456")
    private String publicUrlPath;
}
