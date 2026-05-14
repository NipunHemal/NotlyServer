package lk.hemal.notly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NotlyServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotlyServerApplication.class, args);
    }

}