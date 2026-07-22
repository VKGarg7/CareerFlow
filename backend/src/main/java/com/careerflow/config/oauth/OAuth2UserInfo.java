package com.careerflow.config.oauth;

import java.util.Map;

/**
 * Normalizes the differently-shaped user-info responses from Google, GitHub,
 * and LinkedIn (OIDC) into a common (email, firstName, lastName) shape.
 */
public class OAuth2UserInfo {

    private final String email;
    private final String firstName;
    private final String lastName;

    private OAuth2UserInfo(String email, String firstName, String lastName) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public static OAuth2UserInfo of(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> ofGoogle(attributes);
            case "github" -> ofGitHub(attributes);
            case "linkedin" -> ofLinkedIn(attributes);
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + registrationId);
        };
    }

    private static OAuth2UserInfo ofGoogle(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String firstName = (String) attributes.getOrDefault("given_name", "");
        String lastName = (String) attributes.getOrDefault("family_name", "");
        return new OAuth2UserInfo(email, firstName, lastName);
    }

    private static OAuth2UserInfo ofLinkedIn(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String firstName = (String) attributes.getOrDefault("given_name", "");
        String lastName = (String) attributes.getOrDefault("family_name", "");
        return new OAuth2UserInfo(email, firstName, lastName);
    }

    private static OAuth2UserInfo ofGitHub(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String firstName = name;
        String lastName = "";
        if (name != null && name.contains(" ")) {
            int idx = name.indexOf(' ');
            firstName = name.substring(0, idx);
            lastName = name.substring(idx + 1);
        } else if (name == null) {
            firstName = (String) attributes.get("login");
        }
        return new OAuth2UserInfo(email, firstName, lastName);
    }
}
