package com.mursalin.ecom.config;

import com.mursalin.ecom.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtService jwtService;

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String token = extractTokenFromRequest(request);

        if (token != null && jwtService.validateToken(token)) {
            return () -> jwtService.extractUsername(token);
        }

        return super.determineUser(request, wsHandler, attributes);
    }

    private String extractTokenFromRequest(ServerHttpRequest request) {

        String query = request.getURI().getQuery();

        if (query != null && query.contains("token=")) {

            for (String param : query.split("&")) {

                if (param.startsWith("token=")) {
                    return URLDecoder.decode(
                            param.substring(6),
                            StandardCharsets.UTF_8
                    );
                }
            }
        }

        return null;
    }
}