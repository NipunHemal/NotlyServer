package lk.hemal.notly;

import lk.hemal.notly.config.RateLimitProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(RateLimitProperties.class)
public class NotlyServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotlyServerApplication.class, args);
    }

}