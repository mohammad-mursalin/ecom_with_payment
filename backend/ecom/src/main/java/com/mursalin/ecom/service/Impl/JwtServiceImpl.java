package com.mursalin.ecom.service.Impl;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.JwtService;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtServiceImpl implements JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:3600000}")
    private long expiration; // default 1 hour

    @Override
    public long getExpiration() {
        return expiration;
    }

    @Override
    @PostConstruct
    public void init() {
        // Validate secret key length for HS512 (requires at least 512 bits = 64 bytes when base64-encoded)
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret must be set in configuration");
        }
        // Decode to check byte length
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        if (keyBytes.length < 64) {
            log.warn("JWT secret key is less than 512 bits. For HS512 algorithm, a 512-bit (64-byte) key is recommended.");
        }
    }

    @Override
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // Extract roles from authorities
        List<String> roles = userDetails.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList();
        claims.put("roles", roles);

        // Include userId if UserDetails implementation provides it
        if (userDetails instanceof UserPrinciples principles) {
            claims.put("userId", principles.getUserId());
        }

        return buildToken(claims, userDetails);
    }

    @Override
    public String generateToken(Map<String, Object> claims, UserDetails userDetails) {
        return buildToken(claims, userDetails);
    }

    private String buildToken(Map<String, Object> claims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    private SecretKey getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimResolver) {
        final Claims claims = extractAllClaims(token);
        return claimResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @Override
    public boolean validateToken(String token) {
        try {
            final Claims claims = extractAllClaims(token);
            return !isTokenExpired(claims);
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException | MalformedJwtException | IllegalArgumentException | SecurityException e) {
            log.warn("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException | MalformedJwtException | IllegalArgumentException | SecurityException e) {
            log.warn("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    private boolean isTokenExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
