package com.careerflow.common;

import com.careerflow.auth.BlacklistedTokenRepository;
import com.careerflow.config.JwtUtil;
import com.careerflow.config.UserDetailsServiceImpl;
import com.careerflow.config.oauth.CustomOAuth2UserService;
import com.careerflow.config.oauth.OAuth2AuthenticationFailureHandler;
import com.careerflow.config.oauth.OAuth2AuthenticationSuccessHandler;
import org.springframework.boot.test.mock.mockito.MockBean;

/**
 * Shared setup for {@code @WebMvcTest} controller slices.
 * Each concrete test class must also declare, on its own class:
 * {@code @AutoConfigureMockMvc(addFilters = false)}, and on its {@code @WebMvcTest}:
 * {@code excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
 * classes = {SecurityConfig.class, JwtAuthFilter.class})}
 * — neither attribute is inherited from a base class.
 */
public abstract class ControllerTestSupport {

    @MockBean
    protected JwtUtil jwtUtil;
    @MockBean
    protected UserDetailsServiceImpl userDetailsServiceImpl;
    @MockBean
    protected CustomOAuth2UserService customOAuth2UserService;
    @MockBean
    protected OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    @MockBean
    protected OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    @MockBean
    protected BlacklistedTokenRepository blacklistedTokenRepository;
}
