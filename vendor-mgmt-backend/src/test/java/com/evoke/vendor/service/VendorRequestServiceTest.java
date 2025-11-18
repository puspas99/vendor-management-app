package com.evoke.vendor.service;

import com.evoke.vendor.dto.request.VendorRequestDto;
import com.evoke.vendor.dto.response.VendorRequestResponse;
import com.evoke.vendor.entity.VendorRequest;
import com.evoke.vendor.enums.VendorOnboardingStatus;
import com.evoke.vendor.repository.VendorRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VendorRequestServiceTest {

    @Mock
    private VendorRequestRepository vendorRequestRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private VendorRequestService vendorRequestService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    private VendorRequestDto testDto;

    @BeforeEach
    void setUp() {
        testDto = VendorRequestDto.builder()
                .vendorName("Test Vendor")
                .vendorEmail("vendor@test.com")
                .contactPerson("John Doe")
                .contactNumber("1234567890")
                .vendorCategory("IT Services")
                .remarks("Test remarks")
                .build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("procurement@test.com");
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void createVendorRequest_WithValidData_ShouldReturnResponse() {
        when(vendorRequestRepository.existsByVendorEmail(anyString())).thenReturn(false);
        when(vendorRequestRepository.save(any(VendorRequest.class)))
                .thenAnswer(i -> {
                    VendorRequest vr = i.getArgument(0);
                    vr.setId(1L);
                    return vr;
                });

        VendorRequestResponse response = vendorRequestService.createVendorRequest(testDto);

        assertNotNull(response);
        assertEquals(testDto.getVendorName(), response.getVendorName());
        assertEquals(testDto.getVendorEmail(), response.getVendorEmail());
        verify(vendorRequestRepository, times(1)).save(any(VendorRequest.class));
        verify(emailService, times(1)).sendVendorInvitationEmail(anyString(), anyString(), anyString());
    }

    @Test
    void createVendorRequest_WithDuplicateEmail_ShouldThrowException() {
        when(vendorRequestRepository.existsByVendorEmail(testDto.getVendorEmail())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> 
                vendorRequestService.createVendorRequest(testDto));
        
        verify(vendorRequestRepository, never()).save(any(VendorRequest.class));
    }

    @Test
    void getVendorRequestById_WithValidId_ShouldReturnResponse() {
        Long testId = 1L;
        VendorRequest vendorRequest = VendorRequest.builder()
                .id(testId)
                .vendorName(testDto.getVendorName())
                .vendorEmail(testDto.getVendorEmail())
                .contactPerson(testDto.getContactPerson())
                .contactNumber(testDto.getContactNumber())
                .vendorCategory(testDto.getVendorCategory())
                .status(VendorOnboardingStatus.REQUESTED)
                .createdBy("procurement@test.com")
                .build();

        when(vendorRequestRepository.findById(testId)).thenReturn(Optional.of(vendorRequest));

        VendorRequestResponse response = vendorRequestService.getVendorRequestById(testId);

        assertNotNull(response);
        assertEquals(testId, response.getId());
        assertEquals(testDto.getVendorName(), response.getVendorName());
    }

    @Test
    void getVendorRequestById_WithInvalidId_ShouldThrowException() {
        Long testId = 999L;
        when(vendorRequestRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> 
                vendorRequestService.getVendorRequestById(testId));
    }
}
