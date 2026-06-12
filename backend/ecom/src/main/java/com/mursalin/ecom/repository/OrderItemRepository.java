package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.OrderItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END " +
            "FROM OrderItem oi JOIN oi.order o " +
            "WHERE o.user.userId = :userId AND oi.productId = :productId " +
            "AND o.status = 'DELIVERED'")
    boolean existsDeliveredOrderItem(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("""
    SELECT oi2.productId
    FROM OrderItem oi1
    JOIN OrderItem oi2 ON oi1.order.id = oi2.order.id
    WHERE oi1.productId = :productId
      AND oi2.productId <> :productId
    GROUP BY oi2.productId
    ORDER BY COUNT(oi2.productId) DESC
    """)
    List<Long> findCoPurchasedProductIds(@Param("productId") Long productId);
}
