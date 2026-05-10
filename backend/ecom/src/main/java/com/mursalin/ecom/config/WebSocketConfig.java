package com.mursalin.ecom.config;

import com.mursalin.ecom.config.JwtHandshakeHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeHandler jwtHandshakeHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // SockJS endpoint with JWT handshake handler
        registry.addEndpoint("/ws")
                .setHandshakeHandler(jwtHandshakeHandler)
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Native WebSocket endpoint
        registry.addEndpoint("/ws")
                .setHandshakeHandler(jwtHandshakeHandler)
                .setAllowedOriginPatterns("*");
    }
}
