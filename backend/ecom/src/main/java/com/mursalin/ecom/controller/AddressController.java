package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.ApiResponse;
import com.mursalin.ecom.dto.AddressRequest;
import com.mursalin.ecom.model.Address;
import com.mursalin.ecom.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Address>>> getMyAddresses(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<Address> addresses = addressService.getMyAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Address>> createAddress(Authentication authentication, @Valid @RequestBody AddressRequest request) {
        Long userId = getUserId(authentication);
        Address saved = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved, "Address added successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Address>> updateAddress(Authentication authentication, @PathVariable Long id, @Valid @RequestBody AddressRequest request) {
        Long userId = getUserId(authentication);
        Address updated = addressService.updateAddress(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Address updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteAddress(Authentication authentication, @PathVariable Long id) {
        Long userId = getUserId(authentication);
        addressService.deleteAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", "Address deleted successfully"));
    }

    @PatchMapping("/{id}/default")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Address>> setDefaultAddress(Authentication authentication, @PathVariable Long id) {
        Long userId = getUserId(authentication);
        Address updated = addressService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Default address updated"));
    }

    private Long getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.mursalin.ecom.model.UserPrinciples principles) {
            return principles.getUserId();
        }
        throw new RuntimeException("Unable to determine user ID");
    }
}
