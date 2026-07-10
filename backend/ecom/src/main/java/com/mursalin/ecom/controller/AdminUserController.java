package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.AdminUserListResponse;
import com.mursalin.ecom.dto.AdminUserRoleUpdateResponse;
import com.mursalin.ecom.dto.AdminUserStatusUpdateResponse;
import com.mursalin.ecom.dto.AdminUserDetailResponse;
import com.mursalin.ecom.dto.OrderSummaryDTO;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.Role;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserController.class);

    private final UserService userService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<AdminUserListResponse>> getAllUsers(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Page<AdminUserListResponse> userPage = userService.getAllUsers(search, page, pageSize);

        List<AdminUserListResponse> content = new ArrayList<>(userPage.getContent());

        PaginatedResponse<AdminUserListResponse> response = new PaginatedResponse<>(
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
        AdminUserDetailResponse response = userService.getUserDetail(userId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<AdminUserRoleUpdateResponse> changeRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Long adminUserId = userPrinciple.getUserId();
        if (userId.equals(adminUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        }
        String roleStr = body.get("role");
        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
        AdminUserRoleUpdateResponse result = userService.changeRole(userId, role);
        logger.info("Admin userId={} changed role of userId={} to {}", adminUserId, userId, role);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<AdminUserStatusUpdateResponse> changeStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        Long adminUserId = userPrinciple.getUserId();
        if (userId.equals(adminUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        }
        String statusStr = body.get("status");
        UserStatus status;
        try {
            status = UserStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
        AdminUserStatusUpdateResponse result = userService.changeStatus(userId, status);
        logger.info("Admin userId={} changed status of userId={} to {}", adminUserId, userId, status);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{userId}/orders")
    public ResponseEntity<PaginatedResponse<OrderSummaryDTO>> getUserOrders(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PaginatedResponse<OrderSummaryDTO> response = orderService.getOrdersByUserId(userId, pageable);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        logger.info("Admin deleted user with userId={}", userId);
        return ResponseEntity.noContent().build();
    }
}
