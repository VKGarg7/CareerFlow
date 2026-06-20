package com.careerflow.auth;

import com.careerflow.auth.dto.RegisterRequest;
import com.careerflow.auth.dto.RegisterResponse;
import com.careerflow.exception.BadRequestException;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("An account with this email already exists");
        }

        String fullName = request.getLastName() != null && !request.getLastName().isBlank()
                ? request.getFirstName() + " " + request.getLastName()
                : request.getFirstName();

        User user = User.builder()
                .fullName(fullName)
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User saved = userRepository.save(user);

        return RegisterResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .message("Account created successfully")
                .build();
    }
}
