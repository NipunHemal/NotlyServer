package lk.hemal.notly.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "email")
@Getter
@Setter
public class EmailConfig {

    private boolean enabled = false;

    private String provider = "google";

    private String from;

    private String fromName = "Notly";

    // SMTP Settings (Google / generic)
    private Smtp smtp = new Smtp();

    @Getter
    @Setter
    public static class Smtp {
        private String host = "smtp.gmail.com";
        private int port = 587;
        private String username;
        private String password;
        private boolean auth = true;
        private boolean startTls = true;
    }
}