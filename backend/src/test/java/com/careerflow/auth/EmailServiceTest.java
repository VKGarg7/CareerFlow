package com.careerflow.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@careerflow.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "https://careerflow.example.com");
    }

    @Test
    void sendPasswordResetEmail_buildsMessage_withResetLinkAndRecipient() {
        emailService.sendPasswordResetEmail("jane@example.com", "abc123");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();
        assertThat(message.getFrom()).isEqualTo("no-reply@careerflow.com");
        assertThat(message.getTo()).containsExactly("jane@example.com");
        assertThat(message.getSubject()).contains("Password Reset");
        assertThat(message.getText()).contains("https://careerflow.example.com/reset-password?token=abc123");
    }
}
