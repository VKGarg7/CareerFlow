package com.careerflow.config.oauth;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OAuth2UserInfoTest {

    @Test
    void of_mapsGoogleAttributes() {
        Map<String, Object> attributes = Map.of(
                "email", "jane@example.com", "given_name", "Jane", "family_name", "Doe");

        OAuth2UserInfo info = OAuth2UserInfo.of("google", attributes);

        assertThat(info.getEmail()).isEqualTo("jane@example.com");
        assertThat(info.getFirstName()).isEqualTo("Jane");
        assertThat(info.getLastName()).isEqualTo("Doe");
    }

    @Test
    void of_mapsLinkedInAttributes() {
        Map<String, Object> attributes = Map.of(
                "email", "jane@example.com", "given_name", "Jane", "family_name", "Doe");

        OAuth2UserInfo info = OAuth2UserInfo.of("linkedin", attributes);

        assertThat(info.getEmail()).isEqualTo("jane@example.com");
        assertThat(info.getFirstName()).isEqualTo("Jane");
    }

    @Test
    void of_isCaseInsensitiveToRegistrationId() {
        Map<String, Object> attributes = Map.of("email", "jane@example.com");

        OAuth2UserInfo info = OAuth2UserInfo.of("GOOGLE", attributes);

        assertThat(info.getEmail()).isEqualTo("jane@example.com");
    }

    @Test
    void of_throwsIllegalArgumentException_forUnsupportedProvider() {
        assertThatThrownBy(() -> OAuth2UserInfo.of("facebook", Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("facebook");
    }

    @Test
    void ofGitHub_splitsFullNameIntoFirstAndLast() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("email", "jane@example.com");
        attributes.put("name", "Jane Doe");

        OAuth2UserInfo info = OAuth2UserInfo.of("github", attributes);

        assertThat(info.getFirstName()).isEqualTo("Jane");
        assertThat(info.getLastName()).isEqualTo("Doe");
    }

    @Test
    void ofGitHub_handlesMultiWordLastName() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("email", "jane@example.com");
        attributes.put("name", "Jane Van Der Berg");

        OAuth2UserInfo info = OAuth2UserInfo.of("github", attributes);

        assertThat(info.getFirstName()).isEqualTo("Jane");
        assertThat(info.getLastName()).isEqualTo("Van Der Berg");
    }

    @Test
    void ofGitHub_treatsSingleWordNameAsFirstNameOnly() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("email", "jane@example.com");
        attributes.put("name", "Jane");

        OAuth2UserInfo info = OAuth2UserInfo.of("github", attributes);

        assertThat(info.getFirstName()).isEqualTo("Jane");
        assertThat(info.getLastName()).isEqualTo("");
    }

    @Test
    void ofGitHub_fallsBackToLogin_whenNameIsNull() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("email", "jane@example.com");
        attributes.put("name", null);
        attributes.put("login", "janedoe123");

        OAuth2UserInfo info = OAuth2UserInfo.of("github", attributes);

        assertThat(info.getFirstName()).isEqualTo("janedoe123");
        assertThat(info.getLastName()).isEqualTo("");
    }
}
