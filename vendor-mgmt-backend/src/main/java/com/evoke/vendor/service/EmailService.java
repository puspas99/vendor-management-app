package com.evoke.vendor.service;

import com.evoke.vendor.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${application.email.from}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        Objects.requireNonNull(toEmail, "Email address cannot be null");
        Objects.requireNonNull(otpCode, "OTP code cannot be null");
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(Constants.EMAIL_SUBJECT_OTP);
            message.setText(String.format(
                "Dear,\n\n" +
                "Your One-Time Password (OTP) for onboarding is: %s\n\n" +
                "This OTP will expire in 5 minutes.\n\n" +
                "If you did not request this OTP, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Onboarding Team",
                otpCode
            ));

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
        }
    }

    @Async
    public void sendVendorInvitationEmail(String toEmail, String vendorName, String invitationLink) {
        Objects.requireNonNull(toEmail, "Email address cannot be null");
        Objects.requireNonNull(invitationLink, "Invitation link cannot be null");
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(Constants.EMAIL_SUBJECT_VENDOR_INVITATION);
            message.setText(String.format(
                "Dear %s,\n\n" +
                "You have been invited to complete the vendor onboarding process.\n\n" +
                "Please click on the following link to begin:\n%s\n\n" +
                "You will need to verify your email using an OTP before proceeding.\n\n" +
                "If you have any questions, please contact our onboarding team.\n\n" +
                "Best regards,\n" +
                "Onboarding Team",
                vendorName,
                invitationLink
            ));

            mailSender.send(message);
            log.info("Invitation email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send invitation email to: {}. Error: {}", toEmail, e.getMessage(), e);
            // Don't throw exception - log and continue so vendor creation still succeeds
            log.warn("Email sending failed but vendor request was created. Please resend invitation manually.");
        }
    }

    @Async
    public void sendFollowUpEmail(String toEmail, String vendorName, String followUpMessage, String followUpType, String invitationToken) {
        Objects.requireNonNull(toEmail, "Email address cannot be null");
        Objects.requireNonNull(followUpMessage, "Follow-up message cannot be null");
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Follow-up Required: Vendor Onboarding - " + followUpType);
            
            String portalLink = "";
            if (invitationToken != null && !invitationToken.isEmpty()) {
                portalLink = String.format(
                    "\n\nPlease click on the following link to access your vendor portal and update your information:\n" +
                    "https://vendor-onboarding-mgmt.azurewebsites.net/vendor-login?token=%s\n\n" +
                    "Alternative: If the above link doesn't work, use this link to generate an OTP:\n" +
                    "https://vendor-onboarding-mgmt.azurewebsites.net/api/v1/vendor/invite/generate-otp?token=%s\n\n" +
                    "Note: These links will allow you to log in and modify your submitted data.\n",
                    invitationToken,
                    invitationToken
                );
            }
            
            message.setText(String.format(
                "Dear %s,\n\n" +
                "We need your attention regarding your vendor onboarding submission.\n\n" +
                "Issue Details:\n" +
                "%s" +
                "%s" +
                "What you need to do:\n" +
                "1. Click the link above to access your vendor portal\n" +
                "2. Review and correct the mentioned fields\n" +
                "3. Re-submit your onboarding form\n\n" +
                "If you have any questions or need assistance, please contact our support team.\n\n" +
                "Thank you for your prompt attention to this matter.\n\n" +
                "Best regards,\n" +
                "Procurment Team",
                vendorName,
                followUpMessage,
                portalLink
            ));

            mailSender.send(message);
            log.info("Follow-up email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send follow-up email to: {}", toEmail, e);
        }
    }
}
