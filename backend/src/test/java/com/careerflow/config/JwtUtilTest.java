package com.careerflow.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SuppressWarnings("null")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "Q2FyZWVyRmxvd1NlY3JldEtleUZvckpXVEF1dGhlbnRpY2F0aW9uMjAyNg==");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86400000L);
    }

    @Test
    void generateToken_producesTokenThatIsValidAndContainsEmail() {
        String token = jwtUtil.generateToken("jane@example.com");

        assertThat(jwtUtil.isTokenValid(token)).isTrue();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("jane@example.com");
    }

    @Test
    void extractExpiration_returnsFutureDateTime() {
        String token = jwtUtil.generateToken("jane@example.com");

        LocalDateTime expiration = jwtUtil.extractExpiration(token);

        assertThat(expiration).isAfter(LocalDateTime.now());
    }

    @Test
    void isTokenValid_returnsFalse_forMalformedToken() {
        assertThat(jwtUtil.isTokenValid("not-a-real-token")).isFalse();
    }

    @Test
    void isTokenValid_returnsFalse_forTokenSignedWithDifferentSecret() {
        String token = jwtUtil.generateToken("jane@example.com");

        JwtUtil otherJwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(otherJwtUtil, "secret", "RGlmZmVyZW50U2VjcmV0S2V5Rm9yVGVzdGluZ1B1cnBvc2VzMTIzNDU2");
        ReflectionTestUtils.setField(otherJwtUtil, "expirationMs", 86400000L);

        assertThat(otherJwtUtil.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalse_forExpiredToken() {
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", -1000L);
        String token = jwtUtil.generateToken("jane@example.com");

        assertThat(jwtUtil.isTokenValid(token)).isFalse();
    }
}
