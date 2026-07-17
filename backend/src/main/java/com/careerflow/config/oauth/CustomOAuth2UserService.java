package com.careerflow.config.oauth;

import com.careerflow.user.AuthProvider;
import com.careerflow.user.Role;
import com.careerflow.user.User;
import com.careerflow.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());

        if ("github".equalsIgnoreCase(registrationId) && attributes.get("email") == null) {
            String primaryEmail = fetchGitHubPrimaryEmail(userRequest.getAccessToken().getTokenValue());
            attributes.put("email", primaryEmail);
        }

        OAuth2UserInfo userInfo = OAuth2UserInfo.of(registrationId, attributes);

        if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
            throw new OAuth2AuthenticationException("Email not available from " + registrationId);
        }

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        String email = userInfo.getEmail().toLowerCase();

        User user = userRepository.findByEmail(email)
                .map(existing -> {
                    if (existing.getProvider() == AuthProvider.LOCAL) {
                        existing.setProvider(provider);
                    }
                    return existing;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .firstName(userInfo.getFirstName() != null && !userInfo.getFirstName().isBlank()
                                ? userInfo.getFirstName() : "User")
                        .lastName(userInfo.getLastName())
                        .provider(provider)
                        .role(Role.USER)
                        .build()));

        userRepository.save(user);

        return new org.springframework.security.oauth2.core.user.DefaultOAuth2User(
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                        "ROLE_" + user.getRole().name())),
                attributes,
                "email"
        );
    }

    private String fetchGitHubPrimaryEmail(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        RequestEntity<Void> request = RequestEntity
                .method(HttpMethod.GET, URI.create("https://api.github.com/user/emails"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", "application/vnd.github+json")
                .build();

        List<Map<String, Object>> emails = restTemplate.exchange(request,
                new org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>>() {
                }).getBody();

        if (emails == null) return null;

        return emails.stream()
                .filter(e -> Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified")))
                .map(e -> (String) e.get("email"))
                .findFirst()
                .orElseGet(() -> emails.stream()
                        .map(e -> (String) e.get("email"))
                        .findFirst()
                        .orElse(null));
    }
}
