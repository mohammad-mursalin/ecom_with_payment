package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.dto.admin.AdminOrderSummaryDTO;
import com.mursalin.ecom.model.*;
import com.mursalin.ecom.repository.*;
import com.mursalin.ecom.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminStatsServiceImpl implements AdminStatsService {

    private static final Logger logger = LoggerFactory.getLogger(AdminStatsService.class);
    private static final List<Order.OrderStatus> REVENUE_STATUSES = List.of(
            Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED
    );
    private static final int TOP_N = 10;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepo productRepository;
    private final WishlistRepository wishlistRepository;
    @Override
    public AdminStatsResponse getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last30 = now.minusDays(30);
        LocalDateTime previous30 = last30.minusDays(30);
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        long totalUsers = userRepository.countByDeletedAtIsNull();
        long newLast30 = userRepository.countByDeletedAtIsNullAndCreatedAtAfter(last30);
        long previousNewUsers = userRepository.countByDeletedAtIsNullAndCreatedAtAfter(previous30) - newLast30;
        double userChange = percentChange(newLast30, previousNewUsers);

        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long confirmedToday = orderRepository.countByStatusAndCreatedAtBetween(Order.OrderStatus.CONFIRMED, todayStart, now);
        long previousOrders = orderRepository.countByStatusInAndCreatedAtBetween(
                List.of(Order.OrderStatus.values()), previous30, last30
        );
        double orderChange = percentChange(totalOrders, previousOrders);

        BigDecimal last30Revenue = orderRepository.sumTotalAmountByStatusesAndCreatedAtBetween(
                REVENUE_STATUSES, last30, now
        );
        if (last30Revenue == null) last30Revenue = BigDecimal.ZERO;

        BigDecimal previousRevenue = orderRepository.sumTotalAmountByStatusesAndCreatedAtBetween(
                REVENUE_STATUSES, previous30, last30
        );
        if (previousRevenue == null) previousRevenue = BigDecimal.ZERO;

        BigDecimal totalRevenue = orderRepository.sumTotalAmountByStatusesAndCreatedAtBetween(
                REVENUE_STATUSES, LocalDateTime.of(2000, 1, 1, 0, 0), now
        );
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        double revenueChange = percentChange(last30Revenue.doubleValue(), previousRevenue.doubleValue());

        long totalProducts = productRepository.countByDeletedAtIsNull();
        long activeProducts = productRepository.countByIsActiveTrueAndDeletedAtIsNull();
        long lowStock = productRepository.countLowStock();

        AdminStatsResponse response = new AdminStatsResponse();
        response.setUsers(new AdminStatsResponse.UserStats(totalUsers, newLast30, userChange));
        response.setOrders(new AdminStatsResponse.OrderStats(totalOrders, pendingOrders, confirmedToday, orderChange));
        response.setRevenue(new AdminStatsResponse.RevenueStats(totalRevenue.doubleValue(), last30Revenue.doubleValue(), revenueChange));
        response.setProducts(new AdminStatsResponse.ProductStats(productRepository.countByDeletedAtIsNull(), activeProducts, lowStock));

        return response;
    }
    @Override
    public RevenueAnalyticsResponse getRevenueAnalytics(LocalDate startDate, LocalDate endDate) {
        LocalDateTime since = startDate.atStartOfDay();
        LocalDateTime until = endDate.plusDays(1).atStartOfDay();

        List<Map<String, Object>> raw = orderRepository.findRevenueByDay(REVENUE_STATUSES, since, until);

        List<RevenueAnalyticsResponse.DailyRevenue> data = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = 0;

        for (Map<String, Object> row : raw) {
            java.sql.Date dateSql = (java.sql.Date) row.get("date");
            LocalDate date = dateSql.toLocalDate();
            BigDecimal revenue = (BigDecimal) row.get("revenue");
            Long orderCount = (Long) row.get("orderCount");
            if (revenue == null) revenue = BigDecimal.ZERO;
            if (orderCount == null) orderCount = 0L;

            data.add(new RevenueAnalyticsResponse.DailyRevenue(date, revenue, orderCount));
            totalRevenue = totalRevenue.add(revenue);
            totalOrders += orderCount;
        }

        return new RevenueAnalyticsResponse(data, totalRevenue, totalOrders);
    }
    @Override
    public OrderAnalyticsResponse getOrderAnalytics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last30 = now.minusDays(30);

        List<Object[]> statusCounts = orderRepository.countByStatusGrouped();
        List<OrderAnalyticsResponse.StatusCount> byStatus = new ArrayList<>();
        for (Object[] row : statusCounts) {
            OrderAnalyticsResponse.StatusCount sc = new OrderAnalyticsResponse.StatusCount();
            Object statusVal = row[0];
            if (statusVal instanceof Order.OrderStatus) {
                sc.setStatus(((Order.OrderStatus) statusVal).name());
            } else if (statusVal instanceof String) {
                sc.setStatus((String) statusVal);
            } else {
                sc.setStatus(statusVal != null ? statusVal.toString() : "UNKNOWN");
            }
            sc.setCount((Long) row[1]);
            byStatus.add(sc);
        }

        List<Map<String, Object>> perDayRaw = orderRepository.findOrderCountByDay(last30, now);
        List<OrderAnalyticsResponse.DailyCount> perDay = new ArrayList<>();
        for (Map<String, Object> row : perDayRaw) {
            OrderAnalyticsResponse.DailyCount dc = new OrderAnalyticsResponse.DailyCount();
            Object dateVal = row.get("date");
            Object cntVal = row.get("cnt");
            dc.setDate(dateVal instanceof java.sql.Date ? ((java.sql.Date) dateVal).toLocalDate() : (dateVal != null ? ((java.time.LocalDate) dateVal) : null));
            dc.setCount(cntVal instanceof Long ? (Long) cntVal : (cntVal != null ? Long.parseLong(cntVal.toString()) : null));
            perDay.add(dc);
        }

        BigDecimal avgOrderValue = orderRepository.averageOrderValueByStatuses(REVENUE_STATUSES);
        if (avgOrderValue == null) avgOrderValue = BigDecimal.ZERO;

        return new OrderAnalyticsResponse(byStatus, perDay, avgOrderValue);
    }
    @Override
    public ProductAnalyticsResponse getProductAnalytics() {
        List<Object[]> topSellingRaw = orderRepository.findTopSellingProducts(REVENUE_STATUSES, PageRequest.of(0, TOP_N));
        List<ProductAnalyticsResponse.TopItem> topSelling = new ArrayList<>();
        int rank = 1;
        for (Object[] row : topSellingRaw) {
            ProductAnalyticsResponse.TopItem item = new ProductAnalyticsResponse.TopItem();
            item.setRank(rank++);
            Object pid = row[0];
            Object name = row[1];
            Object cnt = row[2];
            Object rev = row[3];
            item.setProductId(pid instanceof Long ? (Long) pid : (pid != null ? Long.parseLong(pid.toString()) : null));
            item.setName(name instanceof String ? (String) name : (name != null ? name.toString() : null));
            item.setCount(cnt instanceof Long ? (Long) cnt : (cnt != null ? Long.parseLong(cnt.toString()) : null));
            item.setRevenue(rev instanceof BigDecimal ? (BigDecimal) rev : (rev != null ? new BigDecimal(rev.toString()) : null));
            topSelling.add(item);
        }

        List<ProductAnalyticsResponse.TopItem> topWishlisted = new ArrayList<>();
        List<Wishlist> allWishlists = wishlistRepository.findAll();
        allWishlists.stream()
                .collect(java.util.stream.Collectors.groupingBy(w -> w.getProduct().getId()))
                .entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue().size(), e1.getValue().size()))
                .limit(TOP_N)
                .forEach(entry -> {
                    ProductAnalyticsResponse.TopItem item = new ProductAnalyticsResponse.TopItem();
                    item.setRank(topWishlisted.size() + 1);
                    item.setProductId(entry.getKey());
                    Product product = entry.getValue().get(0).getProduct();
                    item.setName(product.getName());
                    item.setCount(entry.getValue().size());
                    item.setRevenue(null);
                    topWishlisted.add(item);
                });

        List<Product> lowStockProducts = productRepository.findByIsActiveTrueAndDeletedAtIsNull(Pageable.unpaged()).getContent();
        List<ProductAnalyticsResponse.LowStockItem> lowStock = new ArrayList<>();
        for (Product p : lowStockProducts) {
            if (p.getLowStockThreshold() != null &&
                    p.getStockQuantity() != null &&
                    p.getStockQuantity() <= p.getLowStockThreshold()) {
                ProductAnalyticsResponse.LowStockItem item = new ProductAnalyticsResponse.LowStockItem();
                item.setProductId(p.getId());
                item.setName(p.getName());
                item.setStock(p.getStockQuantity());
                item.setLowStockThreshold(p.getLowStockThreshold());
                lowStock.add(item);
            }
        }

        return new ProductAnalyticsResponse(topSelling, topWishlisted, lowStock);
    }
    @Override
    public UserAnalyticsResponse getUserAnalytics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last30 = now.minusDays(30);

        List<Object[]> rawResults = userRepository.findNewUsersPerDayRaw(last30, now);
        List<UserAnalyticsResponse.DailyCount> newPerDay = new ArrayList<>();
        for (Object[] row : rawResults) {
            UserAnalyticsResponse.DailyCount dc = new UserAnalyticsResponse.DailyCount();
            Object dateVal = row[0];
            Object cntVal = row[1];
            dc.setDate(dateVal instanceof java.sql.Date ? ((java.sql.Date) dateVal).toLocalDate() : (dateVal != null ? ((java.time.LocalDate) dateVal) : null));
            dc.setCount(cntVal instanceof Long ? (Long) cntVal : (cntVal != null ? Long.parseLong(cntVal.toString()) : null));
            newPerDay.add(dc);
        }

        long totalActive = userRepository.countByStatusAndLastLoginAtAfter(UserStatus.ACTIVE, last30);

        return new UserAnalyticsResponse(newPerDay, totalActive);
    }
    @Override
    public Page<AdminOrderSummaryDTO> getAdminOrders(
            String search,
            Order.OrderStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String paymentMethod,
            int page,
            int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        String startDateStr = startDate != null
                ? startDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null;
        String endDateStr = endDate != null
                ? endDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null;
        String statusStr = status != null ? status.name() : null;
        Page<Order> orders = orderRepository.searchAdminOrders(
                search, statusStr, startDateStr, endDateStr, paymentMethod, pageable);
        return orders.map(AdminOrderSummaryDTO::fromOrder);
    }
    
    private double percentChange(double current, double previous) {
        if (previous == 0) return current == 0 ? 0 : 100.0;
        return ((current - previous) / previous) * 100.0;
    }

    private double percentChange(long current, long previous) {
        return percentChange((double) current, (double) previous);
    }
}
