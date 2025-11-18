package com.evoke.vendor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorRequestDto {

    @NotBlank(message = "Vendor name is required")
    @Size(min = 2, max = 200, message = "Vendor name must be between 2 and 200 characters")
    private String vendorName;

    @NotBlank(message = "Vendor email is required")
    @Email(message = "Invalid email format")
    private String vendorEmail;

    @NotBlank(message = "Contact person is required")
    @Size(min = 2, max = 100, message = "Contact person name must be between 2 and 100 characters")
    private String contactPerson;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone number must be 10-15 digits, optionally starting with +. No spaces, dashes, or special characters allowed. Example: +1234567890 or 1234567890")
    private String contactNumber;

    @NotBlank(message = "Vendor category is required")
    private String vendorCategory;

    @Size(max = 1000, message = "Remarks cannot exceed 1000 characters")
    private String remarks;
}
