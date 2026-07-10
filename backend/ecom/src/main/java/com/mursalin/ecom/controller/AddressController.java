package com.mursalin.ecom.controller;

import com.mursalin.ecom.dto.AddressRequest;
import com.mursalin.ecom.dto.AddressResponse;
import com.mursalin.ecom.dto.ApiResponse;
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
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyAddresses(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<AddressResponse> responses = addressService.getMyAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(Authentication authentication, @Valid @RequestBody AddressRequest request) {
        Long userId = getUserId(authentication);
        AddressResponse response = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Address added successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(Authentication authentication, @PathVariable Long id, @Valid @RequestBody AddressRequest request) {
        Long userId = getUserId(authentication);
        AddressResponse response = addressService.updateAddress(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Address updated successfully"));
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
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(Authentication authentication, @PathVariable Long id) {
        Long userId = getUserId(authentication);
        AddressResponse response = addressService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Default address updated"));
    }

    private Long getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.mursalin.ecom.model.UserPrinciples principles) {
            return principles.getUserId();
        }
        throw new RuntimeException("Unable to determine user ID");
    }
}
