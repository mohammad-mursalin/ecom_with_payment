package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.Address;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserStatus;
import com.mursalin.ecom.repository.UserRepository;
import com.mursalin.ecom.service.UserService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public Page<AdminUserListResponse> getAllUsers(String search, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        return userRepository.search(search, pageable).map(AdminUserListResponse::fromEntity);
    }

    @Override
    public Optional<User> getUserById(Long userId) {
        return userRepository.findByUserId(userId);
    }

    @Override
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findByUserId(userId)
                .orElse(null);
        if (user == null) {
            return null;
        }

        List<DeliveryAddressDTO> addressDTOs = userRepository.findAddressesByUserId(userId).stream()
                .map(addr -> new DeliveryAddressDTO(
                        addr.getFullName(),
                        addr.getPhone(),
                        addr.getLine1(),
                        addr.getLine2(),
                        addr.getCity(),
                        addr.getState(),
                        addr.getPinCode(),
                        addr.getCountry()
                ))
                .toList();

        var recentOrdersPage = getRecentOrdersByUserId(userId, 10);
        List<OrderSummaryDTO> recentOrders = recentOrdersPage.getContent().stream()
                .map(order -> {
                    List<OrderSummaryItemDTO> items = order.getOrderItems().stream()
                            .map(OrderSummaryItemDTO::fromOrderItem)
                            .toList();
                    return new OrderSummaryDTO(
                            order.getId(),
                            order.getCreatedAt(),
                            items.size(),
                            order.getTotalAmount(),
                            order.getStatus().name(),
                            items
                    );
                })
                .toList();

        AdminUserDetailResponse response = new AdminUserDetailResponse();
        response.setUserId(user.getUserId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLoginAt(user.getLastLoginAt());
        response.setOrderCount(countOrdersByUserId(userId));
        response.setTotalSpent(sumTotalAmountByUserId(userId));
        response.setAddresses(addressDTOs);
        response.setRecentOrders(recentOrders);

        return response;
    }

    @Override
    public void deleteUser(Long userId) {
        userRepository.deleteByUserId(userId);
    }

    @Override
    public AdminUserRoleUpdateResponse changeRole(Long userId, Role role) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setRole(role);
        userRepository.save(user);
        return AdminUserRoleUpdateResponse.fromEntity(user);
    }

    @Override
    public AdminUserStatusUpdateResponse changeStatus(Long userId, UserStatus status) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setStatus(status);
        userRepository.save(user);
        return AdminUserStatusUpdateResponse.fromEntity(user);
    }

    @Override
    public long countOrdersByUserId(Long userId) {
        return userRepository.countOrdersByUserIdAndStatuses(userId,
                List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED));
    }

    @Override
    public BigDecimal sumTotalAmountByUserId(Long userId) {
        return userRepository.sumTotalAmountByUserIdAndStatuses(userId,
                List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED));
    }

    @Override
    public List<Address> getAddressesByUserId(Long userId) {
        return userRepository.findAddressesByUserId(userId);
    }

    @Override
    public Page<Order> getRecentOrdersByUserId(Long userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return userRepository.findRecentOrdersByUserId(userId, pageable);
    }
}
