package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Long findUserIdByEmail(String email);

    Optional<User> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
