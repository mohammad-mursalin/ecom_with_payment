package com.mursalin.ecom.dto;

import com.mursalin.ecom.model.AddressSnapshot;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailsResponse {
    private Long id;
    private LocalDateTime createdAt;
    private String paymentMethod;
    private DeliveryAddressDTO deliveryAddress;
    private List<OrderDetailItemDTO> items;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String status;
    private String trackingNumber;
    private String courierName;
    private List<StatusHistoryDTO> statusHistory;

    public static OrderDetailsResponse fromOrder(com.mursalin.ecom.model.Order order) {
        OrderDetailsResponse response = new OrderDetailsResponse();
        response.setId(order.getId());
        response.setCreatedAt(order.getCreatedAt());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setStatus(order.getStatus().name());

        if (order.getDeliveryAddress() != null) {
            AddressSnapshot snap = order.getDeliveryAddress();
            response.setDeliveryAddress(new DeliveryAddressDTO(
                    snap.getFullName(), snap.getPhone(), snap.getLine1(), snap.getLine2(),
                    snap.getCity(), snap.getState(), snap.getPinCode(), snap.getCountry()
            ));
        }

        response.setItems(order.getOrderItems().stream()
                .map(OrderDetailItemDTO::fromOrderItem)
                .toList());

        response.setSubtotal(order.getSubtotal());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setTaxAmount(order.getTaxAmount());
        response.setShippingFee(order.getShippingFee());
        response.setTotalAmount(order.getTotalAmount());
        response.setTrackingNumber(order.getTrackingNumber());
        response.setCourierName(order.getShippingCarrier());

        if (order.getStatusHistory() != null) {
            response.setStatusHistory(order.getStatusHistory().stream()
                    .map(h -> new StatusHistoryDTO(h.getNewStatus(), h.getChangedAt(), h.getNote()))
                    .toList());
        }

        return response;
    }
}
