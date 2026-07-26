package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AdminUserDetailResponse;
import com.mursalin.ecom.dto.AdminUserListResponse;
import com.mursalin.ecom.dto.AdminUserRoleUpdateResponse;
import com.mursalin.ecom.dto.AdminUserStatusUpdateResponse;
import com.mursalin.ecom.model.Address;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.model.Role;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserStatus;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();

    Page<AdminUserListResponse> getAllUsers(String search, int page, int pageSize);

    Optional<User> getUserById(Long userId);

    AdminUserDetailResponse getUserDetail(Long userId);

    void deleteUser(Long userId);

    AdminUserRoleUpdateResponse changeRole(Long userId, Role role);

    AdminUserStatusUpdateResponse changeStatus(Long userId, UserStatus status);

    long countOrdersByUserId(Long userId);

    BigDecimal sumTotalAmountByUserId(Long userId);

    List<Address> getAddressesByUserId(Long userId);

    Page<Order> getRecentOrdersByUserId(Long userId, int limit);
}
