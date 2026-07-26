package com.mursalin.ecom.service;

import com.mursalin.ecom.model.RefreshToken;

import java.util.Optional;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(Long userId);

    RefreshToken verifyExpiration(RefreshToken token);

    void deleteByUserId(Long userId);

    Optional<RefreshToken> findByToken(String token);
}
