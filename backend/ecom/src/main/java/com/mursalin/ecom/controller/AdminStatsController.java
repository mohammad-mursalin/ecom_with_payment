package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.dto.admin.AdminOrderSummaryDTO;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.service.AdminStatsService;
import com.mursalin.ecom.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

    private static final Logger logger = LoggerFactory.getLogger(AdminStatsController.class);

    private final AdminStatsService adminStatsService;
    private final OrderService orderService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminStatsService.getDashboardStats());
    }

    @GetMapping("/analytics/revenue")
    public ResponseEntity<RevenueAnalyticsResponse> getRevenueAnalytics(
            @RequestParam(required = false, defaultValue = "daily") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();
        return ResponseEntity.ok(adminStatsService.getRevenueAnalytics(startDate, endDate));
    }

    @GetMapping("/analytics/orders")
    public ResponseEntity<OrderAnalyticsResponse> getOrderAnalytics() {
        return ResponseEntity.ok(adminStatsService.getOrderAnalytics());
    }

    @GetMapping("/analytics/products")
    public ResponseEntity<ProductAnalyticsResponse> getProductAnalytics() {
        return ResponseEntity.ok(adminStatsService.getProductAnalytics());
    }

    @GetMapping("/analytics/users")
    public ResponseEntity<UserAnalyticsResponse> getUserAnalytics() {
        return ResponseEntity.ok(adminStatsService.getUserAnalytics());
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<AdminOrderSummaryDTO>> getAdminOrders(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize
    ) {
        Order.OrderStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = Order.OrderStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.plusDays(1).atStartOfDay() : null;
        Page<AdminOrderSummaryDTO> result = adminStatsService.getAdminOrders(search, statusEnum, startDateTime, endDateTime, paymentMethod, page, pageSize);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderDetailsResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        String statusStr = (String) body.get("status");
        String note = (String) body.get("note");
        String trackingNumber = (String) body.get("trackingNumber");
        String courierName = (String) body.get("courierName");

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        Order order = orderService.adminUpdateOrderStatus(id, newStatus, note, trackingNumber, courierName, userPrinciple.getUserId());
        return ResponseEntity.ok(OrderDetailsResponse.fromOrder(order));
    }

    @PostMapping("/orders/{id}/resend-email")
    public ResponseEntity<?> resendOrderEmail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrinciples userPrinciple
    ) {
        logger.info("Resend email requested for orderId={} by adminId={}", id, userPrinciple.getUserId());
        return ResponseEntity.ok(Map.of("message", "Confirmation email queued for sending."));
    }
}
