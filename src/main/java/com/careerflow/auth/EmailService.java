package com.careerflow.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("CareerFlow - Password Reset Request");
        message.setText(
                "Hi,\n\n" +
                "You requested to reset your password.\n\n" +
                "Click the link below to reset it (expires in 15 minutes):\n" +
                resetLink + "\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "- CareerFlow Team"
        );

        mailSender.send(message);
    }
}
