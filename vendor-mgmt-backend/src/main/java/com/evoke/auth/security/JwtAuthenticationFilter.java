package com.evoke.auth.security;

import com.evoke.auth.Constants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtProvider jwtProvider;
    
    private static final List<String> EXCLUDE_PATHS = List.of(
        "/assets/", "/static/", "/favicon.ico", "/index.html"
    );

    private boolean isStaticPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String p : EXCLUDE_PATHS) {
            if (path.startsWith(p) || path.matches(".*\\.(css|js|png|svg|map)$")) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        boolean shouldSkip = path.equals("/") 
            || path.equals("/index.html")
            || path.equals("/error")
            || path.equals("/favicon.ico")
            || path.startsWith("/login")
            || path.startsWith("/static/")
            || path.startsWith("/assets/")
            || path.startsWith("/vendor-mgmt-frontend/")
            || path.startsWith("/api/v1/auth/")
            || path.startsWith("/api/v1/vendor/otp/")
            || path.startsWith("/api/v1/vendor/invite/")
            || path.startsWith("/api/v1/vendor/onboarding")
            || path.startsWith("/api/v1/vendor/document-verification")
            || path.startsWith("/actuator")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/swagger-ui")
            || path.equals("/swagger-ui.html")
            || path.startsWith("/webjars/")
            || path.matches(".*\\.(css|js|png|svg|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|map)$");
        
        return shouldSkip;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
          if (isStaticPath(request)) {
            // don't attempt JWT auth for static resources
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);
            
            log.debug("Processing request to: {} with JWT present: {}", request.getRequestURI(), (jwt != null));
            
            if (StringUtils.hasText(jwt)) {
                log.debug("JWT token found in request for path: {}", request.getRequestURI());
                log.debug("JWT token (first 20 chars): {}", jwt.substring(0, Math.min(20, jwt.length())));
                
                if (jwtProvider.validateToken(jwt)) {
                    String username = jwtProvider.getUsernameFromToken(jwt);
                    String authoritiesString = jwtProvider.getAuthoritiesFromToken(jwt);
                    
                    log.debug("JWT validated for user: {} with authorities: {}", username, authoritiesString);
                    
                    // Extract authorities from JWT instead of database lookup
                    List<GrantedAuthority> authorities = Collections.emptyList();
                    if (StringUtils.hasText(authoritiesString)) {
                        authorities = Arrays.stream(authoritiesString.split(","))
                            .map(String::trim)
                            .filter(StringUtils::hasText)
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                    }
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Set authentication for user: {} with authorities: {}", username, authorities);
                } else {
                    log.warn("JWT token validation failed for path: {}", request.getRequestURI());
                }
            } else {
                log.warn("No JWT token found in request for path: {} - Authorization header: {}", 
                    request.getRequestURI(), request.getHeader("Authorization"));
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage(), e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(Constants.JWT_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(Constants.JWT_TOKEN_PREFIX)) {
            return bearerToken.substring(Constants.JWT_TOKEN_PREFIX.length());
        }
        return null;
    }
}