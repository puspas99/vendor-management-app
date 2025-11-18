package com.evoke.vendor.service;

import com.evoke.vendor.entity.OtpToken;
import com.evoke.vendor.repository.OtpTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpTokenRepository otpTokenRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OtpService otpService;

    private String testEmail;
    private String testOtp;

    @BeforeEach
    void setUp() {
        testEmail = "test@example.com";
        testOtp = "123456";
    }

    @Test
    void generateAndSendOtp_ShouldSaveOtpAndSendEmail() {
        when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(i -> i.getArguments()[0]);

        otpService.generateAndSendOtp(testEmail);

        verify(otpTokenRepository, times(1)).save(any(OtpToken.class));
        verify(emailService, times(1)).sendOtpEmail(eq(testEmail), anyString());
    }

    @Test
    void verifyOtp_WithValidOtp_ShouldReturnTrue() {
        OtpToken otpToken = OtpToken.builder()
                .email(testEmail)
                .otpCode(testOtp)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .build();

        when(otpTokenRepository.findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
                eq(testEmail), eq(testOtp), any(LocalDateTime.class)))
                .thenReturn(Optional.of(otpToken));
        when(otpTokenRepository.save(any(OtpToken.class))).thenAnswer(i -> i.getArguments()[0]);

        boolean result = otpService.verifyOtp(testEmail, testOtp);

        assertTrue(result);
        verify(otpTokenRepository, times(1)).save(any(OtpToken.class));
    }

    @Test
    void verifyOtp_WithInvalidOtp_ShouldReturnFalse() {
        when(otpTokenRepository.findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
                eq(testEmail), eq(testOtp), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        boolean result = otpService.verifyOtp(testEmail, testOtp);

        assertFalse(result);
        verify(otpTokenRepository, never()).save(any(OtpToken.class));
    }

    @Test
    void generateAndSendOtp_WithNullEmail_ShouldThrowException() {
        assertThrows(NullPointerException.class, () -> otpService.generateAndSendOtp(null));
    }

    @Test
    void verifyOtp_WithNullEmail_ShouldThrowException() {
        assertThrows(NullPointerException.class, () -> otpService.verifyOtp(null, testOtp));
    }
}
