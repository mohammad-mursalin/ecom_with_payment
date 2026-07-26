package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.AddressRequest;
import com.mursalin.ecom.dto.AddressResponse;

import java.util.List;

public interface AddressService {
    List<AddressResponse> getMyAddresses(Long userId);

    AddressResponse createAddress(Long userId, AddressRequest request);

    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest updated);

    void deleteAddress(Long userId, Long addressId);

    AddressResponse setDefaultAddress(Long userId, Long addressId);
}
