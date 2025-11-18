package com.evoke.vendor.security;

import com.evoke.auth.entity.Role;
import com.evoke.auth.entity.User;
import com.evoke.auth.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;
    private String secretKey;
    private long jwtExpiration;

    @BeforeEach
    void setUp() {
        secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        jwtExpiration = 86400000L; // 24 hours
        jwtProvider = new JwtProvider(secretKey, jwtExpiration);
    }

    @Test
    void generateAccessToken_ShouldReturnValidToken() {
        Role role = new Role();
        role.setName("ROLE_VENDOR");
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        
        User user = new User();
        user.setId(1L);
        user.setUsername("test@example.com");
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setRoles(roles);

        String token = jwtProvider.generateAccessToken(user);

        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    void generateTokenFromEmail_ShouldReturnValidToken() {
        String email = "test@example.com";

        String token = jwtProvider.generateTokenFromEmail(email);

        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    void getEmailFromToken_ShouldReturnCorrectEmail() {
        String email = "test@example.com";
        String token = jwtProvider.generateTokenFromEmail(email);

        String extractedEmail = jwtProvider.getEmailFromToken(token);

        assertEquals(email, extractedEmail);
    }

    @Test
    void getUsernameFromToken_ShouldReturnCorrectUsername() {
        Role role = new Role();
        role.setName("ROLE_VENDOR");
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        
        User user = new User();
        user.setId(1L);
        user.setUsername("test@example.com");
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setRoles(roles);

        String token = jwtProvider.generateAccessToken(user);
        String username = jwtProvider.getUsernameFromToken(token);

        assertEquals("test@example.com", username);
    }

    @Test
    void getUserIdFromToken_ShouldReturnCorrectUserId() {
        Role role = new Role();
        role.setName("ROLE_VENDOR");
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        
        User user = new User();
        user.setId(1L);
        user.setUsername("test@example.com");
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setRoles(roles);

        String token = jwtProvider.generateAccessToken(user);
        Long userId = jwtProvider.getUserIdFromToken(token);

        assertEquals(1L, userId);
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        String email = "test@example.com";
        String token = jwtProvider.generateTokenFromEmail(email);

        boolean isValid = jwtProvider.validateToken(token);

        assertTrue(isValid);
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        String invalidToken = "invalid.token.here";

        boolean isValid = jwtProvider.validateToken(invalidToken);

        assertFalse(isValid);
    }

    @Test
    void validateToken_WithNullToken_ShouldThrowException() {
        assertThrows(NullPointerException.class, () -> jwtProvider.validateToken(null));
    }

    @Test
    void getAuthoritiesFromToken_ShouldReturnCorrectAuthorities() {
        Role role = new Role();
        role.setName("ROLE_VENDOR");
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        
        User user = new User();
        user.setId(1L);
        user.setUsername("test@example.com");
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setRoles(roles);

        String token = jwtProvider.generateAccessToken(user);
        String authorities = jwtProvider.getAuthoritiesFromToken(token);

        assertEquals("ROLE_VENDOR", authorities);
    }

    @Test
    void getExpirationMs_ShouldReturnConfiguredExpiration() {
        Long expiration = jwtProvider.getExpirationMs();

        assertEquals(jwtExpiration, expiration);
    }
}
