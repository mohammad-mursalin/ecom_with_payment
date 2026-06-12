package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    @Query("select a from Address a where a.user.userId = :userId")
    List<Address> findByUserId(@Param("userId") Long userId);

    @Query("select a from Address a where a.user.userId = :userId and a.isDefault = true")
    List<Address> findByUserIdAndIsDefaultTrue(@Param("userId") Long userId);
}
