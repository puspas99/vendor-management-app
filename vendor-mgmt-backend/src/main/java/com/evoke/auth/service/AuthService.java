package com.evoke.auth.service;

import com.evoke.auth.Constants;
import com.evoke.auth.dto.requests.LoginRequest;
import com.evoke.auth.dto.requests.RegisterRequest;
import com.evoke.auth.dto.responses.TokenResponse;
import com.evoke.auth.entity.Role;
import com.evoke.auth.entity.User;
import com.evoke.auth.repository.RoleRepository;
import com.evoke.auth.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthService {
    
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    
    @Transactional
    public User register(RegisterRequest request) {
        Objects.requireNonNull(request, "Register request cannot be null");
        
        log.debug("Attempting to register user: {}", request.getUsername());
        
        if (userService.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        
        if (userService.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }
        
        // Create new user
        User user = new User(
            request.getUsername().trim(),
            request.getEmail().trim().toLowerCase(),
            passwordEncoder.encode(request.getPassword()),
            request.getFullName().trim()
        );
        
        // Set optional fields
        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            user.setDepartment(request.getDepartment().trim());
        }
        
        user.setEnabled(true);
        user.setStatus("ACTIVE");
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);
        
        // Assign default role
        Role userRole = roleRepository.findByName(Constants.ROLE_USER)
            .orElseThrow(() -> new IllegalStateException("Default role ROLE_USER not found"));
        
        user.addRole(userRole);
        
        User savedUser = userService.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());
        
        return savedUser;
    }
    
    @Transactional
    public TokenResponse login(LoginRequest request) {
        Objects.requireNonNull(request, "Login request cannot be null");
        
        log.debug("Attempting to login user: {}", request.getUsername());
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getUsername().trim(),
                    request.getPassword()
                )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userService.findByUsernameWithRoles(request.getUsername().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
            
            if (!user.getEnabled()) {
                log.warn("Login attempt for deactivated account: {}", user.getUsername());
                throw new BadCredentialsException("Invalid credentials");
            }
            
            // Generate tokens
            String accessToken = jwtProvider.generateAccessToken(user);
            String refreshToken = refreshTokenService.createRefreshToken(user).getToken();
            Long expirationMs = jwtProvider.getExpirationMs();
            
            // Get primary role
            String primaryRole = user.getRoles().isEmpty() ? "USER" : 
                user.getRoles().iterator().next().getName().replace("ROLE_", "");
            
            log.info("User logged in successfully: {}", user.getUsername());
            
            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(expirationMs)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(primaryRole)
                    .build();
            
        } catch (AuthenticationException e) {
            log.warn("Login failed for user: {}", request.getUsername());
            throw new BadCredentialsException("Invalid credentials");
        }
    }
    
    @Transactional
    public TokenResponse refreshToken(String refreshTokenValue) {
        Objects.requireNonNull(refreshTokenValue, "Refresh token cannot be null");
        
        log.debug("Attempting to refresh token");
        
        var refreshToken = refreshTokenService.verifyExpiration(refreshTokenValue);
        User user = refreshToken.getUser();
        
        if (!user.getEnabled()) {
            refreshTokenService.revokeToken(refreshTokenValue);
            throw new BadCredentialsException("User account is deactivated");
        }
        
        // Rotate refresh token for security
        refreshTokenService.revokeToken(refreshTokenValue);
        String newRefreshToken = refreshTokenService.createRefreshToken(user).getToken();
        
        // Generate new access token
        String accessToken = jwtProvider.generateAccessToken(user);
        Long expirationMs = jwtProvider.getExpirationMs();
        
        // Get primary role
        String primaryRole = user.getRoles().isEmpty() ? "USER" : 
            user.getRoles().iterator().next().getName().replace("ROLE_", "");
        
        log.debug("Token refreshed successfully for user: {}", user.getUsername());
        
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(expirationMs)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(primaryRole)
                .build();
    }
    
    @Transactional
    public void logout(String refreshTokenValue) {
        Objects.requireNonNull(refreshTokenValue, "Refresh token cannot be null");
        
        log.debug("Attempting to logout");
        
        refreshTokenService.revokeToken(refreshTokenValue);
        SecurityContextHolder.clearContext();
        
        log.debug("User logged out successfully");
    }
    
    @Transactional
    public void logoutAllDevices(String username) {
        Objects.requireNonNull(username, "Username cannot be null");
        
        User user = userService.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        
        refreshTokenService.revokeAllUserTokens(user);
        SecurityContextHolder.clearContext();
        
        log.info("All devices logged out for user: {}", username);
    }
}