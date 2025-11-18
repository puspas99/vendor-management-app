package com.evoke.vendor.integration;

import com.evoke.vendor.dto.request.OtpRequestDto;
import com.evoke.vendor.dto.request.OtpVerificationDto;
import com.evoke.vendor.dto.request.VendorRequestDto;
import com.evoke.vendor.entity.OtpToken;
import com.evoke.vendor.repository.OtpTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class VendorManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    private VendorRequestDto vendorRequestDto;
    private OtpRequestDto otpRequestDto;

    @BeforeEach
    void setUp() {
        vendorRequestDto = VendorRequestDto.builder()
                .vendorName("Test Vendor Inc")
                .vendorEmail("vendor@testvendor.com")
                .contactPerson("John Doe")
                .contactNumber("1234567890")
                .vendorCategory("IT Services")
                .remarks("Test integration")
                .build();

        otpRequestDto = OtpRequestDto.builder()
                .email("vendor@testvendor.com")
                .build();
    }

    @Test
    void generateOtp_ShouldReturnSuccess() throws Exception {
        mockMvc.perform(post("/api/vendor/otp/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otpRequestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void verifyOtp_WithValidOtp_ShouldReturnToken() throws Exception {
        String testOtp = "123456";
        OtpToken otpToken = OtpToken.builder()
                .email(otpRequestDto.getEmail())
                .otpCode(testOtp)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .build();
        otpTokenRepository.save(otpToken);

        OtpVerificationDto verificationDto = OtpVerificationDto.builder()
                .email(otpRequestDto.getEmail())
                .otpCode(testOtp)
                .build();

        mockMvc.perform(post("/api/vendor/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verificationDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.email").value(otpRequestDto.getEmail()));
    }

    @Test
    @WithMockUser(username = "procurement@test.com", roles = {"PROCUREMENT"})
    void createVendorRequest_WithAuthentication_ShouldReturnCreated() throws Exception {
        mockMvc.perform(post("/api/procurement/vendor/onboarding-request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(vendorRequestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.vendorName").value(vendorRequestDto.getVendorName()))
                .andExpect(jsonPath("$.data.vendorEmail").value(vendorRequestDto.getVendorEmail()));
    }

    @Test
    @WithMockUser(username = "procurement@test.com", roles = {"PROCUREMENT"})
    void getAllVendors_ShouldReturnList() throws Exception {
        mockMvc.perform(get("/api/procurement/vendors")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void createVendorRequest_WithoutAuthentication_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(post("/api/procurement/vendor/onboarding-request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(vendorRequestDto)))
                .andExpect(status().isUnauthorized());
    }
}
