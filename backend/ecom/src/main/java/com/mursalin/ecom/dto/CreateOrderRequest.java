package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
//@NoArgsConstructor
//@AllArgsConstructor
public class CreateOrderRequest {
    private List<OrderItemDTO> items;
    private String customerEmail;
    private String shippingAddress;

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(List<OrderItemDTO> items, String customerEmail, String shippingAddress) {
        this.items = items;
        this.customerEmail = customerEmail;
        this.shippingAddress = shippingAddress;
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
}