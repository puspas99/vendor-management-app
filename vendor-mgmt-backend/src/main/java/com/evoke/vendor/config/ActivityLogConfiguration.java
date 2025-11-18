package com.evoke.vendor.config;

import com.evoke.vendor.service.VendorActivityLogService;
import com.evoke.vendor.service.VendorRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
@RequiredArgsConstructor
public class ActivityLogConfiguration {

    private final VendorRequestService vendorRequestService;
    private final VendorActivityLogService activityLogService;

    @PostConstruct
    public void init() {
        vendorRequestService.setActivityLogService(activityLogService);
    }
}
