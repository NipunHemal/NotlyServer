package lk.hemal.notly.config.security;

import lk.hemal.notly.config.ApiConfig;
import lk.hemal.notly.security.JwtAuthenticationFilter;
import lk.hemal.notly.security.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final ApiConfig apiConfig;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .frameOptions(Customizer.withDefaults())
                )
                .authorizeHttpRequests(auth -> auth
                                // Public endpoints
                                .requestMatchers(
                                        "/",
                                        "/test",
                                        ApiConfig.API_BASE_PATH + "/auth/**",
                                        "/oauth2/**",
                                        "/login/oauth2/**",
                                        ApiConfig.API_BASE_PATH + "/notes/public/**",
                                        ApiConfig.API_BASE_PATH + "/groups/public/**",
                                        "/actuator/health"
                                ).permitAll()

                                // Swagger endpoints
                                .requestMatchers(
                                        "/swagger-ui.html",
                                        "/swagger-ui/**",
                                        "/v3/api-docs/**"
                                ).permitAll()

                                // Authenticated app endpoints
                                .requestMatchers(
                                        ApiConfig.API_BASE_PATH + "/groups/**",
                                        ApiConfig.API_BASE_PATH + "/notes/**",
                                        ApiConfig.API_BASE_PATH + "/workspaces/**",
                                        ApiConfig.API_BASE_PATH + "/bin/**",
                                        ApiConfig.API_BASE_PATH + "/favorites/**",
                                        ApiConfig.API_BASE_PATH + "/users/**"
                                ).authenticated()

                                .requestMatchers(ApiConfig.API_BASE_PATH + "/admin/**").hasAuthority("ADMIN")
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setContentType("application/json");
                            res.setStatus(401);
                            res.getWriter().write("{\"success\":false,\"message\":\"Unauthorized. Please login.\"}");
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setContentType("application/json");
                            res.setStatus(403);
                            res.getWriter().write("{\"success\":false,\"message\":\"Access denied.\"}");
                        })
                )
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(apiConfig.getAllowedOrigins()));
        config.setAllowedMethods(List.of(apiConfig.getAllowedMethods()));
        config.setAllowedHeaders(List.of(apiConfig.getAllowedHeaders()));
        config.setExposedHeaders(List.of(
                "Authorization", "Content-Type",
                "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Retry-After"
        ));
        config.setAllowCredentials(apiConfig.isAllowedCredentials());
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}