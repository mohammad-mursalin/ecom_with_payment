package com.mursalin.ecom.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
//@NoArgsConstructor
//@AllArgsConstructor
public class CreateOrderRequest {
    private List<OrderItemDTO> items;
    private String customerEmail;

    @NotBlank(message = "Shipping address is required")
    @Size(max = 500, message = "Shipping address must be at most 500 characters")
    private String shippingAddress;

    @NotNull(message = "Shipping cost is required")
    @DecimalMin(value = "0.0", message = "Shipping cost must be non-negative")
    private BigDecimal shippingCost;

    @NotBlank(message = "Shipping method is required")
    private String shippingMethod;

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(List<OrderItemDTO> items, String customerEmail, String shippingAddress, BigDecimal shippingCost, String shippingMethod) {
        this.items = items;
        this.customerEmail = customerEmail;
        this.shippingAddress = shippingAddress;
        this.shippingCost = shippingCost;
        this.shippingMethod = shippingMethod;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public BigDecimal getShippingCost() {
        return shippingCost;
    }

    public void setShippingCost(BigDecimal shippingCost) {
        this.shippingCost = shippingCost;
    }

    public String getShippingMethod() {
        return shippingMethod;
    }

    public void setShippingMethod(String shippingMethod) {
        this.shippingMethod = shippingMethod;
    }
}