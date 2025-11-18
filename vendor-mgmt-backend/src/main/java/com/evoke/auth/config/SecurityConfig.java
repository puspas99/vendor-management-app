package com.evoke.auth.config;

import com.evoke.auth.security.CustomUserDetailsService;
import com.evoke.auth.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*")); // Configure specific origins in production
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
            )
            .authorizeHttpRequests(authz -> authz
                // Public endpoints - ORDER MATTERS, most specific first
                .requestMatchers("/", "/index.html", "/error").permitAll()
                .requestMatchers("/assets/**", "/static/**").permitAll()  // Allow all static assets
                .requestMatchers("/*.css", "/*.js", "/*.png", "/*.jpg", "/*.jpeg", 
                                "/*.gif", "/*.svg", "/*.ico", "/*.woff", "/*.woff2", 
                                "/*.ttf", "/*.eot", "/*.map").permitAll()  // Allow all static file types in root
                .requestMatchers("/actuator", "/actuator/**").permitAll()
                .requestMatchers("/v3/api-docs", "/v3/api-docs/**", "/v3/api-docs/swagger-config").permitAll()
                .requestMatchers("/swagger-ui", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/webjars/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/vendor/otp/**").permitAll()  // Allow OTP generation and verification
                .requestMatchers("/api/v1/vendor/invite/**").permitAll()  // Allow invitation validation and redirect
                .requestMatchers("/api/v1/vendor/by-email").permitAll()  // Allow vendor to get their request by email
                .requestMatchers("/api/v1/vendor/onboarding").permitAll()  // Allow vendor onboarding submission (POST)
                .requestMatchers("/api/v1/vendor/onboarding/*").permitAll()  // Allow vendor to access their onboarding data (GET)
                .requestMatchers("/api/v1/vendor/document-verification/**").permitAll()  // Allow document verification
                .requestMatchers("/login", "/vendor-mgmt-frontend/**").permitAll()

                // Admin endpoints
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // Notification endpoints - require authentication
                .requestMatchers("/api/v1/notifications/**").hasAnyRole("USER", "PROCUREMENT", "ADMIN")
                // Procurement endpoints - allow USER, PROCUREMENT, and ADMIN roles
                .requestMatchers("/api/v1/procurement/**").hasAnyRole("USER", "PROCUREMENT", "ADMIN")
                // Vendor endpoints - require authentication with Bearer token
                .requestMatchers("/api/v1/vendor/**").authenticated()
                // All other endpoints require authentication
                //.anyRequest().authenticated()
            );
        
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}