package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.UserProfileResponse;
import com.mursalin.ecom.model.Address;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserStatus;
import com.mursalin.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> getAllUsers(String search, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        return userRepository.search(search, pageable);
    }

    public Optional<User> getUserById(Long userId) {
        return userRepository.findByUserId(userId);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteByUserId(userId);
    }

    public void changeRole(Long userId, Role role) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setRole(role);
        userRepository.save(user);
    }

    public void changeStatus(Long userId, UserStatus status) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setStatus(status);
        userRepository.save(user);
    }

    public long countOrdersByUserId(Long userId) {
        return userRepository.countOrdersByUserIdAndStatuses(userId,
                List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED));
    }

    public BigDecimal sumTotalAmountByUserId(Long userId) {
        return userRepository.sumTotalAmountByUserIdAndStatuses(userId,
                List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED));
    }

    public List<Address> getAddressesByUserId(Long userId) {
        return userRepository.findAddressesByUserId(userId);
    }

    public Page<Order> getRecentOrdersByUserId(Long userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return userRepository.findRecentOrdersByUserId(userId, pageable);
    }
}
