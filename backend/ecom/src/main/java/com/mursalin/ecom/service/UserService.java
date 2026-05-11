package com.mursalin.ecom.service;

import com.mursalin.ecom.model.User;
import com.mursalin.ecom.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long userId) {
        return userRepository.findByUserId(userId);
    }

    public void deleteUser(Long userId) {
        // Optional: prevent admin from deleting themselves
        // or other business rules
        userRepository.deleteByUserId(userId);
    }
}
