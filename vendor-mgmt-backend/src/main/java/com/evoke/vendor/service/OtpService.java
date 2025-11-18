package com.evoke.vendor.service;

import com.evoke.vendor.entity.OtpToken;
import com.evoke.vendor.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;

    @Value("${application.security.otp.expiration}")
    private long otpExpiration;

    @Value("${application.security.otp.length}")
    private int otpLength;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public void generateAndSendOtp(String email) {
        Objects.requireNonNull(email, "Email cannot be null");
        
        String otpCode = generateOtpCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(otpExpiration / 1000);

        OtpToken otpToken = OtpToken.builder()
                .email(email)
                .otpCode(otpCode)
                .expiresAt(expiresAt)
                .isUsed(false)
                .build();

        otpTokenRepository.save(otpToken);
        
        emailService.sendOtpEmail(email, otpCode);
        
        log.info("OTP generated and sent to email: {}", email);
    }

    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        Objects.requireNonNull(email, "Email cannot be null");
        Objects.requireNonNull(otpCode, "OTP code cannot be null");
        
        OtpToken otpToken = otpTokenRepository
                .findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(email, otpCode, LocalDateTime.now())
                .orElse(null);

        if (otpToken == null) {
            log.warn("Invalid or expired OTP for email: {}", email);
            return false;
        }

        otpToken.setIsUsed(true);
        otpToken.setUsedAt(LocalDateTime.now());
        otpTokenRepository.save(otpToken);

        log.info("OTP verified successfully for email: {}", email);
        return true;
    }

    private String generateOtpCode() {
        int bound = (int) Math.pow(10, otpLength);
        int otp = RANDOM.nextInt(bound);
        return String.format("%0" + otpLength + "d", otp);
    }

    @Transactional
    public void cleanupExpiredOtps() {
        otpTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.info("Cleaned up expired OTP tokens");
    }
}
