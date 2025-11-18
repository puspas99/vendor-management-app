package com.evoke.vendor.entity;

import com.evoke.vendor.enums.ActivityType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_activity_log", schema = "dbo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vendor_request_id", nullable = false)
    private VendorRequest vendorRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActivityType activityType;

    @Column(nullable = false, columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String details;

    @Column(nullable = false, length = 100)
    private String performedBy;

    @Column(length = 50)
    private String performedByRole;

    @Column(nullable = false)
    private LocalDateTime performedAt;

    @Column(length = 100)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        if (performedAt == null) {
            performedAt = LocalDateTime.now();
        }
    }
}
