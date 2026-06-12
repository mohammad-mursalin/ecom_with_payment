package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.RefreshToken;
import com.mursalin.ecom.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUser(User user);

    void deleteByUser(User user);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    boolean existsByToken(String token);

    void deleteByUser_UserId(Long userId);
}
