package com.careerflow.auth;

import com.careerflow.config.CacheConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    @Cacheable(value = CacheConfig.TOKEN_BLACKLIST_CACHE, key = "#token")
    public boolean isBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }

    @CachePut(value = CacheConfig.TOKEN_BLACKLIST_CACHE, key = "#token")
    public boolean markBlacklisted(String token) {
        return true;
    }
}
