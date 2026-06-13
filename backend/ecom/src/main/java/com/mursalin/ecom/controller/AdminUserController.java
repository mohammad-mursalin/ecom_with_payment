package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.AdminUserDetailResponse;
import com.mursalin.ecom.dto.DeliveryAddressDTO;
import com.mursalin.ecom.dto.OrderSummaryDTO;
import com.mursalin.ecom.dto.OrderSummaryItemDTO;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.model.UserStatus;
import com.mursalin.ecom.service.OrderService;
import com.mursalin.ecom.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserController.class);

    private final UserService userService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<Map<String, Object>>> getAllUsers(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<User> userPage = userService.getAllUsers(search, page, pageSize);

        List<Map<String, Object>> content = userPage.getContent().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", u.getUserId());
            map.put("email", u.getEmail());
            map.put("username", u.getUsername());
            map.put("role", u.getRole());
            map.put("status", u.getStatus());
            map.put("createdAt", u.getCreatedAt());
            map.put("lastLoginAt", u.getLastLoginAt());
            return map;
        }).collect(Collectors.toList());

        PaginatedResponse<Map<String, Object>> response = new PaginatedResponse<>(
                content,
                userPage.getNumber(),
                userPage.getTotalPages(),
                userPage.getTotalElements(),
                userPage.getSize(),
                userPage.isFirst(),
                userPage.isLast()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserDetailResponse> getUserById(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        User user = userService.getUserById(userId)
                .orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        List<DeliveryAddressDTO> addressDTOs = userService.getAddressesByUserId(userId).stream()
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

        List<OrderSummaryDTO> recentOrders = userService.getRecentOrdersByUserId(userId, 10).getContent().stream()
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
        response.setOrderCount(userService.countOrdersByUserId(userId));
        response.setTotalSpent(userService.sumTotalAmountByUserId(userId));
        response.setAddresses(addressDTOs);
        response.setRecentOrders(recentOrders);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<Map<String, Object>> changeRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Long adminUserId = userPrinciple.getUserId();
        if (userId.equals(adminUserId)) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Cannot change your own role");
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(error);
        }
        String roleStr = body.get("role");
        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid role");
            return ResponseEntity.badRequest().body(error);
        }
        userService.changeRole(userId, role);
        logger.info("Admin userId={} changed role of userId={} to {}", adminUserId, userId, role);
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("role", role);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<Map<String, Object>> changeStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Long adminUserId = userPrinciple.getUserId();
        if (userId.equals(adminUserId)) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Cannot change your own status");
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(error);
        }
        String statusStr = body.get("status");
        UserStatus status;
        try {
            status = UserStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid status");
            return ResponseEntity.badRequest().body(error);
        }
        userService.changeStatus(userId, status);
        logger.info("Admin userId={} changed status of userId={} to {}", adminUserId, userId, status);
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("status", status);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{userId}/orders")
    public ResponseEntity<PaginatedResponse<OrderSummaryDTO>> getUserOrders(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderService.getOrdersByUserId(userId, pageable);
        List<OrderSummaryDTO> content = orderPage.getContent().stream()
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
        return ResponseEntity.ok(new PaginatedResponse<>(content, page, orderPage.getTotalPages(),
                orderPage.getTotalElements(), size, !orderPage.hasPrevious(), !orderPage.hasNext()));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        logger.info("Admin deleted user with userId={}", userId);
        return ResponseEntity.noContent().build();
    }
}
