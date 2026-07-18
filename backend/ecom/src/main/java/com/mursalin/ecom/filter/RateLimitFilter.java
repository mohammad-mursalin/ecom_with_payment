package com.mursalin.ecom.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.codec.ByteArrayCodec;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

@Component
@Order(0)
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    private volatile LettuceBasedProxyManager<byte[]> proxyManager;

    private static final Map<String, RateLimitRule> RATE_LIMIT_RULES = new HashMap<>();
    private static final String RATE_LIMIT_BUCKET_PREFIX = "ratelimit:";

    static {
        RATE_LIMIT_RULES.put("/api/auth/login", new RateLimitRule(5, Duration.ofMinutes(1), "clientIp"));
        RATE_LIMIT_RULES.put("/api/auth/register", new RateLimitRule(3, Duration.ofMinutes(1), "clientIp"));
        RATE_LIMIT_RULES.put("/api/chat", new RateLimitRule(15, Duration.ofMinutes(1), "authUserIdOrClientIp"));
        RATE_LIMIT_RULES.put("/api/chat/messages/", new RateLimitRule(10, Duration.ofMinutes(1), "authUserIdOrClientIp"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String requestMethod = request.getMethod();

        RateLimitRule rule = null;
        String matchedPattern = null;
        for (String pattern : RATE_LIMIT_RULES.keySet()) {
            if (path.startsWith(pattern) && requestMethod.equalsIgnoreCase("POST")) {
                rule = RATE_LIMIT_RULES.get(pattern);
                matchedPattern = pattern;
                break;
            }
        }

        if (rule != null) {
            String key = generateKey(request, rule.keyType, matchedPattern);

            Bucket bucket = resolveBucket(key, rule.limit);

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                sendRateLimitedResponse(response);
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private String generateKey(HttpServletRequest request, String keyType, String pattern) {
        switch (keyType) {
            case "clientIp":
                return RATE_LIMIT_BUCKET_PREFIX + pattern + ":" + getClientIp(request);
            case "authUserIdOrClientIp":
                Long userId = getUserIdFromAuthentication();
                if (userId != null) {
                    return RATE_LIMIT_BUCKET_PREFIX + pattern + ":user:" + userId;
                } else {
                    return RATE_LIMIT_BUCKET_PREFIX + pattern + ":" + getClientIp(request);
                }
            default:
                return RATE_LIMIT_BUCKET_PREFIX + pattern + ":" + getClientIp(request);
        }
    }

    private Long getUserIdFromAuthentication() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof com.mursalin.ecom.model.UserPrinciples) {
                    return ((com.mursalin.ecom.model.UserPrinciples) principal).getUserId();
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private synchronized LettuceBasedProxyManager<byte[]> getProxyManager() {
        if (proxyManager == null) {
            RedisURI redisUri = RedisURI.builder()
                    .withHost(redisHost)
                    .withPort(redisPort)
                    .build();

            RedisClient redisClient = RedisClient.create(redisUri);
            proxyManager = LettuceBasedProxyManager.builderFor(redisClient)
                    .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(Duration.ofMinutes(1)))
                    .build();
        }
        return proxyManager;
    }

    private Bucket resolveBucket(String key, int limit) {
        LettuceBasedProxyManager<byte[]> proxyManager = getProxyManager();
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);

        Supplier<BucketConfiguration> configSupplier = () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(limit, Refill.intervally(limit, Duration.ofMinutes(1))))
                .build();

        return proxyManager.builder().build(keyBytes, configSupplier);
    }

    private void sendRateLimitedResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("status", 429);
        errorBody.put("error", "RATE_LIMITED");
        errorBody.put("message", "Too many requests — please try again shortly.");
        errorBody.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }

    private static class RateLimitRule {
        final int limit;
        final Duration period;
        final String keyType;

        RateLimitRule(int limit, Duration period, String keyType) {
            this.limit = limit;
            this.period = period;
            this.keyType = keyType;
        }
    }
}
