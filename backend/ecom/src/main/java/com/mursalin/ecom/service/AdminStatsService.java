package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AdminStatsResponse;
import com.mursalin.ecom.dto.OrderAnalyticsResponse;
import com.mursalin.ecom.dto.ProductAnalyticsResponse;
import com.mursalin.ecom.dto.RevenueAnalyticsResponse;
import com.mursalin.ecom.dto.UserAnalyticsResponse;
import com.mursalin.ecom.dto.admin.AdminOrderSummaryDTO;
import com.mursalin.ecom.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface AdminStatsService {
    AdminStatsResponse getDashboardStats();

    RevenueAnalyticsResponse getRevenueAnalytics(LocalDate startDate, LocalDate endDate);

    OrderAnalyticsResponse getOrderAnalytics();

    ProductAnalyticsResponse getProductAnalytics();

    UserAnalyticsResponse getUserAnalytics();

    Page<AdminOrderSummaryDTO> getAdminOrders(
            String search,
            Order.OrderStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String paymentMethod,
            int page,
            int pageSize);
}
