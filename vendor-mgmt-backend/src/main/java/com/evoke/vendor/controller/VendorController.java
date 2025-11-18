package com.evoke.vendor.controller;

import com.evoke.vendor.dto.request.OtpRequestDto;
import com.evoke.vendor.dto.request.OtpVerificationDto;
import com.evoke.vendor.dto.request.VendorOnboardingDto;
import com.evoke.vendor.dto.response.ApiResponse;
import com.evoke.vendor.dto.response.AuthResponse;
import com.evoke.vendor.dto.response.VendorOnboardingResponse;
import com.evoke.vendor.enums.ActivityType;
import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.evoke.vendor.service.VendorActivityLogService;
import com.evoke.vendor.service.VendorRequestService;
import com.evoke.auth.security.JwtProvider;
import com.evoke.vendor.service.OtpService;
import com.evoke.vendor.service.VendorOnboardingService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/vendor")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "Bearer Authentication")
public class VendorController {

    private final OtpService otpService;
    private final JwtProvider jwtProvider;
    private final VendorOnboardingService vendorOnboardingService;
    private final com.evoke.vendor.service.VendorRequestService vendorRequestService;
    private final VendorActivityLogService activityLogService;

    @Value("${application.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/otp/generate")
    public ResponseEntity<ApiResponse<String>> generateOtp(@Valid @RequestBody OtpRequestDto requestDto) {
        try {
            otpService.generateAndSendOtp(requestDto.getEmail());
            return ResponseEntity.ok(ApiResponse.success(
                    "OTP sent successfully to " + requestDto.getEmail(),
                    null
            ));
        } catch (Exception e) {
            log.error("Error generating OTP", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody OtpVerificationDto requestDto) {
        try {
            boolean isValid = otpService.verifyOtp(requestDto.getEmail(), requestDto.getOtpCode());
            
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid or expired OTP"));
            }

            String token = jwtProvider.generateTokenFromEmail(requestDto.getEmail());
            
            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .email(requestDto.getEmail())
                    .role("VENDOR")
                    .build();

            return ResponseEntity.ok(ApiResponse.success(
                    "OTP verified successfully",
                    authResponse
            ));
        } catch (Exception e) {
            log.error("Error verifying OTP", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to verify OTP: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/onboarding", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VendorOnboardingResponse>> submitOnboarding(
            @Valid @ModelAttribute VendorOnboardingDto onboardingDto,
            @RequestParam(value = "businessDetailsFile", required = false) MultipartFile businessDetailsFile,
            @RequestParam(value = "contactDetailsFile", required = false) MultipartFile contactDetailsFile,
            @RequestParam(value = "bankingDetailsFile", required = false) MultipartFile bankingDetailsFile,
            @RequestParam(value = "complianceDetailsFile", required = false) MultipartFile complianceDetailsFile,
            // Legacy support for old file names
            @RequestParam(value = "complianceFile", required = false) MultipartFile complianceFile
    ) {
        try {
            // Use new file if provided, otherwise fall back to legacy complianceFile
            MultipartFile finalComplianceFile = complianceDetailsFile != null ? complianceDetailsFile : complianceFile;
            
            VendorOnboardingResponse response = vendorOnboardingService.submitVendorOnboarding(
                    onboardingDto,
                    businessDetailsFile,
                    contactDetailsFile,
                    bankingDetailsFile,
                    finalComplianceFile
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Vendor onboarding submitted successfully",
                            response
                    ));
        } catch (IllegalArgumentException e) {
            log.error("Validation error during onboarding", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error submitting vendor onboarding", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to submit onboarding: " + e.getMessage()));
        }
    }

    @GetMapping("/invite/validate")
    public ResponseEntity<ApiResponse<com.evoke.vendor.dto.response.VendorRequestResponse>> validateInvitation(
            @RequestParam String token
    ) {
        try {
            com.evoke.vendor.dto.response.VendorRequestResponse inviteInfo = vendorRequestService.getVendorRequestResponseByToken(token);

            return ResponseEntity.ok(ApiResponse.success(
                    "Invitation token is valid",
                    inviteInfo
            ));
        } catch (IllegalArgumentException e) {
            log.error("Invalid invitation token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Invalid or expired invitation link"));
        } catch (Exception e) {
            log.error("Error validating invitation token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Unable to validate invitation. Please contact the procurement team."));
        }
    }

    @GetMapping("/invite/generate-otp")
    public ResponseEntity<Void> generateOtpAndRedirect(@RequestParam String token) {
        try {
            com.evoke.vendor.entity.VendorRequest vendorRequest = vendorRequestService.getVendorRequestByToken(token);
            otpService.generateAndSendOtp(vendorRequest.getVendorEmail());
            
            // Update status to AWAITING_RESPONSE when vendor opens the link
            vendorRequestService.updateVendorRequestStatus(vendorRequest.getId(), VendorOnboardingStatus.AWAITING_RESPONSE);
            
            // Log activity
            activityLogService.logActivity(
                    vendorRequest.getId(),
                    ActivityType.LINK_OPENED,
                    "Vendor opened invitation link",
                    "Email: " + vendorRequest.getVendorEmail()
            );
            
            activityLogService.logActivity(
                    vendorRequest.getId(),
                    ActivityType.OTP_GENERATED,
                    "OTP generated and sent to vendor",
                    "Email: " + vendorRequest.getVendorEmail()
            );

            URI redirect = URI.create(String.format("%s/vendor/onboard?token=%s&otpSent=true", frontendUrl, token));
            return ResponseEntity.status(302).location(redirect).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid invitation token for OTP generation", e);
            URI errorRedirect = URI.create(String.format("%s/vendor/onboard?token=%s&error=invalid", frontendUrl, token));
            return ResponseEntity.status(302).location(errorRedirect).build();
        } catch (Exception e) {
            log.error("Error generating OTP and redirecting", e);
            URI errorRedirect = URI.create(String.format("%s/vendor/onboard?token=%s&error=server", frontendUrl, token));
            return ResponseEntity.status(302).location(errorRedirect).build();
        }
    }

    @GetMapping("/by-email")
    public ResponseEntity<ApiResponse<com.evoke.vendor.dto.response.VendorRequestResponse>> getVendorByEmail(
            @RequestParam String email
    ) {
        try {
            com.evoke.vendor.dto.response.VendorRequestResponse vendorRequest = vendorRequestService.getVendorRequestByEmail(email);
            return ResponseEntity.ok(ApiResponse.success(
                    "Vendor request found",
                    vendorRequest
            ));
        } catch (IllegalArgumentException e) {
            log.error("Vendor request not found for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching vendor request by email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch vendor request: " + e.getMessage()));
        }
    }

    @GetMapping("/onboarding/{requestId}")
    public ResponseEntity<ApiResponse<VendorOnboardingResponse>> getOnboardingByRequestId(
            @PathVariable Long requestId
    ) {
        try {
            VendorOnboardingResponse onboarding = vendorOnboardingService.getOnboardingByRequestId(requestId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Onboarding data found",
                    onboarding
            ));
        } catch (IllegalArgumentException e) {
            log.error("Onboarding data not found for request ID: {}", requestId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching onboarding data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch onboarding data: " + e.getMessage()));
        }
    }
}
