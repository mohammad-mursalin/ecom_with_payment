package com.mursalin.ecom.chat.tool.order;

import com.mursalin.ecom.chat.tool.ToolErrorCode;
import com.mursalin.ecom.chat.tool.ToolResult;
import com.mursalin.ecom.chat.tool.ChatAuthResolver;
import com.mursalin.ecom.dto.OrderDetailItemDTO;
import com.mursalin.ecom.dto.OrderDetailsResponse;
import com.mursalin.ecom.dto.OrderSummaryDTO;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.model.Order;
import com.mursalin.ecom.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderTools {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 20;

    private final OrderService orderService;

    public ToolResult<List<OrderSummary>> getMyOrders(String status, Integer limit) {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }

        if (status != null && !status.isBlank()) {
            try {
                Order.OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
            }
        }

        int resolvedLimit = limit != null ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;

        try {
            Order.OrderStatus statusEnum = (status != null && !status.isBlank())
                    ? Order.OrderStatus.valueOf(status.toUpperCase())
                    : null;
            PageRequest pageable = PageRequest.of(0, resolvedLimit);
            PaginatedResponse<OrderSummaryDTO> page = statusEnum == null
                    ? orderService.getOrdersByUserId(userId, pageable)
                    : orderService.getOrdersByUserIdAndStatus(userId, statusEnum, pageable);

            List<OrderSummary> summaries = page.getContent().stream()
                    .map(this::toOrderSummary)
                    .toList();
            return ToolResult.success(summaries);
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<OrderStatusDetail> getOrderStatus(Long orderId) {
        Long userId = ChatAuthResolver.resolveUserId();
        if (userId == null) {
            return ToolResult.failure(ToolErrorCode.AUTH_REQUIRED);
        }

        if (orderId == null || orderId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        Order order;
        try {
            order = orderService.getOrderByIdForUser(orderId, userId);
        } catch (AccessDeniedException e) {
            return ToolResult.failure(ToolErrorCode.NOT_FOUND);
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }

        if (order == null) {
            return ToolResult.failure(ToolErrorCode.NOT_FOUND);
        }

        OrderDetailsResponse detail = OrderDetailsResponse.fromOrder(order);
        return ToolResult.success(toOrderStatusDetail(detail));
    }

    private OrderSummary toOrderSummary(OrderSummaryDTO dto) {
        List<OrderItemSummary> items = dto.getItems() == null
                ? List.of()
                : dto.getItems().stream()
                .map(item -> new OrderItemSummary(
                        item.getProductName(),
                        item.getPrimaryImageUrl(),
                        item.getQuantity()
                ))
                .toList();
        return new OrderSummary(
                dto.getId(),
                dto.getCreatedAt(),
                dto.getItemCount(),
                dto.getTotalAmount(),
                dto.getStatus(),
                items
        );
    }

    private OrderStatusDetail toOrderStatusDetail(OrderDetailsResponse detail) {
        List<StatusHistoryEntry> historyEntries = detail.getStatusHistory() == null
                ? List.of()
                : detail.getStatusHistory().stream()
                .map(h -> new StatusHistoryEntry(
                        h.getStatus(),
                        h.getChangedAt(),
                        h.getNote()
                ))
                .toList();

        List<OrderDetailItem> detailItems = detail.getItems() == null
                ? List.of()
                : detail.getItems().stream()
                .map(item -> new OrderDetailItem(
                        item.getProductName(),
                        item.getPrimaryImageUrl(),
                        item.getQuantity()
                ))
                .toList();

        return new OrderStatusDetail(
                detail.getId(),
                detail.getStatus(),
                detail.getTrackingNumber(),
                null,
                detail.getCourierName(),
                detailItems,
                detail.getSubtotal(),
                detail.getTotalAmount(),
                historyEntries
        );
    }

    public record OrderSummary(
            Long id,
            LocalDateTime createdAt,
            Integer itemCount,
            BigDecimal totalAmount,
            String status,
            List<OrderItemSummary> items
    ) {
    }

    public record OrderItemSummary(
            String productName,
            String primaryImageUrl,
            Integer quantity
    ) {
    }

    public record OrderStatusDetail(
            Long id,
            String status,
            String trackingNumber,
            String trackingUrl,
            String shippingCarrier,
            List<OrderDetailItem> items,
            BigDecimal subtotal,
            BigDecimal totalAmount,
            List<StatusHistoryEntry> statusHistory
    ) {
    }

    public record OrderDetailItem(
            String productName,
            String primaryImageUrl,
            Integer quantity
    ) {
    }

    public record StatusHistoryEntry(
            String status,
            LocalDateTime changedAt,
            String note
    ) {
    }
}
