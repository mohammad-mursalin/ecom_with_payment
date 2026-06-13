package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Address;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    Long findUserIdByEmail(String email);

    Optional<User> findByUserId(Long userId);

    List<User> findByStatus(UserStatus status);

    void deleteByUserId(Long userId);

    long countByStatusAndLastLoginAtAfter(UserStatus status, LocalDateTime since);

    long countByCreatedAtAfter(LocalDateTime since);

    long countByDeletedAtIsNull();

    long countByDeletedAtIsNullAndCreatedAtAfter(LocalDateTime since);

    @Query("select u from User u where (:search is null or :search = '' or " +
            "lower(u.email) like lower(concat('%', :search, '%')) or " +
            "lower(u.username) like lower(concat('%', :search, '%')))")
    Page<User> search(@Param("search") String search, Pageable pageable);

    @Query("select count(o) from Order o join o.user u where u.userId = :userId and o.status in :statuses")
    long countOrdersByUserIdAndStatuses(@Param("userId") Long userId, @Param("statuses") List<Order.OrderStatus> statuses);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o join o.user u where u.userId = :userId and o.status in :statuses")
    java.math.BigDecimal sumTotalAmountByUserIdAndStatuses(@Param("userId") Long userId, @Param("statuses") List<Order.OrderStatus> statuses);

    @Query("select o from Order o join o.user u where u.userId = :userId order by o.createdAt desc")
    Page<Order> findRecentOrdersByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("select a from Address a where a.user.userId = :userId")
    List<Address> findAddressesByUserId(@Param("userId") Long userId);

    @Query("SELECT CAST(u.createdAt AS date) as date, COUNT(u) as count " +
           "FROM User u WHERE u.createdAt BETWEEN :start AND :end " +
           "GROUP BY CAST(u.createdAt AS date) ORDER BY CAST(u.createdAt AS date) ASC")
    List<Object[]> findNewUsersPerDayRaw(@Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);
}
