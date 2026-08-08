package com.careerflow.config;

import com.careerflow.user.Role;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Cacheable(value = CacheConfig.USER_DETAILS_CACHE, key = "#email")
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email.toLowerCase())
                .map(user -> {
                    Role role = user.getRole() != null ? user.getRole() : Role.USER;
                    return org.springframework.security.core.userdetails.User
                            .withUsername(user.getEmail())
                            .password(user.getPassword() != null ? user.getPassword() : "{bcrypt}!")
                            .disabled(!user.isActive())
                            .authorities("ROLE_" + role.name())
                            .build();
                })
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
