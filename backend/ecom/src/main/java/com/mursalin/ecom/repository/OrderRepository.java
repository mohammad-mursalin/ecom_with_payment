package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByStripeSessionId(String stripeSessionId);
    Optional<Order> findByStripePaymentIntentId(String stripePaymentIntentId);
    
    @Query("select o from Order o where o.user.userId = :userId")
    List<Order> findByUserId(@Param("userId") Long userId);
    
    @Query("select o from Order o where o.user.userId = :userId")
    Page<Order> findByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Query("select o from Order o where o.user.userId = :userId and o.status = :status")
    Page<Order> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Order.OrderStatus status, Pageable pageable);
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);
    Page<Order> findAll(Pageable pageable);

    long countByStatus(Order.OrderStatus status);

    long countByStatusAndCreatedAtBetween(
            Order.OrderStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    long countByStatusInAndCreatedAtBetween(
            List<Order.OrderStatus> statuses,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("select count(distinct o.user.userId) from Order o where o.status in :statuses and o.createdAt >= :since")
    long countDistinctUsersByStatusesAndCreatedAtAfter(
            @Param("statuses") List<Order.OrderStatus> statuses,
            @Param("since") LocalDateTime since
    );

    @Query("select sum(o.totalAmount) from Order o where o.status in :statuses and o.createdAt >= :since and o.createdAt < :until")
    BigDecimal sumTotalAmountByStatusesAndCreatedAtBetween(
            @Param("statuses") List<Order.OrderStatus> statuses,
            @Param("since") LocalDateTime since,
            @Param("until") LocalDateTime until
    );

    @Query("select o from Order o where (:search is null or :search = '' or " +
            "lower(o.customerEmail) like lower(concat('%', :search, '%')) or " +
            "lower(cast(o.id as string)) like lower(concat('%', :search, '%')))")
    Page<Order> searchOrders(
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
            SELECT o.* FROM orders o
            WHERE
              (:search IS NULL OR :search = '' OR
               LOWER(o.customer_email) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(CAST(o.id AS TEXT)) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:status IS NULL OR o.status = :status)
              AND (:startDate IS NULL OR o.created_at >= CAST(:startDate AS timestamp))
              AND (:endDate IS NULL OR o.created_at < CAST(:endDate AS timestamp))
              AND (:paymentMethod IS NULL OR o.payment_method = :paymentMethod)
            ORDER BY o.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM orders o
            WHERE
              (:search IS NULL OR :search = '' OR
               LOWER(o.customer_email) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(CAST(o.id AS TEXT)) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:status IS NULL OR o.status = :status)
              AND (:startDate IS NULL OR o.created_at >= CAST(:startDate AS timestamp))
              AND (:endDate IS NULL OR o.created_at < CAST(:endDate AS timestamp))
              AND (:paymentMethod IS NULL OR o.payment_method = :paymentMethod)
            """,
            nativeQuery = true)
    Page<Order> searchAdminOrders(
            @Param("search") String search,
            @Param("status") String status,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate,
            @Param("paymentMethod") String paymentMethod,
            Pageable pageable
    );

    @Query("select function('date', o.createdAt) as date, sum(o.totalAmount) as revenue, count(o) as orderCount " +
            "from Order o where o.status in :statuses and o.createdAt >= :since and o.createdAt < :until " +
            "group by function('date', o.createdAt) order by function('date', o.createdAt) asc")
    List<Map<String, Object>> findRevenueByDay(
            @Param("statuses") List<Order.OrderStatus> statuses,
            @Param("since") LocalDateTime since,
            @Param("until") LocalDateTime until
    );

    @Query("select function('date', o.createdAt) as date, count(o) as cnt " +
            "from Order o where o.createdAt >= :since and o.createdAt < :until " +
            "group by function('date', o.createdAt) order by function('date', o.createdAt) asc")
    List<Map<String, Object>> findOrderCountByDay(
            @Param("since") LocalDateTime since,
            @Param("until") LocalDateTime until
    );

    @Query("select o.status, count(o) from Order o group by o.status")
    List<Object[]> countByStatusGrouped();

    @Query("select avg(o.totalAmount) from Order o where o.status in :statuses")
    BigDecimal averageOrderValueByStatuses(
            @Param("statuses") List<Order.OrderStatus> statuses
    );

    @Query("select oi.productId, p.name, sum(oi.quantity) as unitsSold, sum(oi.subtotal) as revenue " +
            "from OrderItem oi join oi.order o join Product p on oi.productId = p.id " +
            "where o.status in :statuses " +
            "group by oi.productId, p.name order by unitsSold desc")
    List<Object[]> findTopSellingProducts(
            @Param("statuses") List<Order.OrderStatus> statuses,
            Pageable pageable
    );
}
