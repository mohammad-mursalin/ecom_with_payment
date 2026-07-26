package com.mursalin.ecom.service;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

public interface JwtService {
    long getExpiration();

    void init();

    String generateToken(UserDetails userDetails);

    String generateToken(Map<String, Object> claims, UserDetails userDetails);

    String extractUsername(String token);

    boolean validateToken(String token);

    boolean validateToken(String token, UserDetails userDetails);
}
