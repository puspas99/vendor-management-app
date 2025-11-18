package com.evoke.vendor.repository;

import com.evoke.vendor.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    
    Optional<OtpToken> findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
        String email, String otpCode, LocalDateTime currentTime);
    
    Optional<OtpToken> findTopByEmailOrderByCreatedAtDesc(String email);
    
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
