package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.dto.AddressRequest;
import com.mursalin.ecom.dto.AddressResponse;
import com.mursalin.ecom.model.Address;
import com.mursalin.ecom.model.User;
import com.mursalin.ecom.repository.AddressRepository;
import com.mursalin.ecom.repository.UserRepository;

import com.mursalin.ecom.service.AddressService;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    public List<AddressResponse> getMyAddresses(Long userId) {
        return addressRepository.findByUserId(userId).stream()
                .map(AddressResponse::fromEntity)
                .toList();
    }

    @Override
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Address address = new Address();
        address.setUser(user);
        address.setLabel(request.getLabel());
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPinCode(request.getPinCode());
        address.setCountry(request.getCountry());
        address.setDefault(request.isDefault());

        if (address.isDefault()) {
            unsetOtherDefaults(userId);
        } else if (addressRepository.findByUserIdAndIsDefaultTrue(userId).isEmpty()) {
            address.setDefault(true);
        }

        address.setCreatedAt(LocalDateTime.now());
        address.setUpdatedAt(LocalDateTime.now());
        return AddressResponse.fromEntity(addressRepository.save(address));
    }

    @Override
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest updated) {
        Address existing = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!existing.getUser().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found for this user");
        }

        existing.setLabel(updated.getLabel());
        existing.setFullName(updated.getFullName());
        existing.setPhone(updated.getPhone());
        existing.setLine1(updated.getLine1());
        existing.setLine2(updated.getLine2());
        existing.setCity(updated.getCity());
        existing.setState(updated.getState());
        existing.setPinCode(updated.getPinCode());
        existing.setCountry(updated.getCountry());

        if (updated.isDefault()) {
            unsetOtherDefaults(userId);
            existing.setDefault(true);
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return AddressResponse.fromEntity(addressRepository.save(existing));
    }
    @Override
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found for this user");
        }

        addressRepository.delete(address);
    }
    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Address not found for this user");
        }

        unsetOtherDefaults(userId);

        address.setDefault(true);
        address.setUpdatedAt(LocalDateTime.now());
        return AddressResponse.fromEntity(addressRepository.save(address));
    }

    private void unsetOtherDefaults(Long userId) {
        List<Address> defaults = addressRepository.findByUserIdAndIsDefaultTrue(userId);
        for (Address a : defaults) {
            a.setDefault(false);
            a.setUpdatedAt(LocalDateTime.now());
            addressRepository.save(a);
        }
    }
}
