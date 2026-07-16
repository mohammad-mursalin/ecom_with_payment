package com.mursalin.ecom.chat.tool.support;

import com.mursalin.ecom.chat.tool.ToolErrorCode;
import com.mursalin.ecom.chat.tool.ToolResult;
import com.mursalin.ecom.dto.CouponValidationResponse;
import com.mursalin.ecom.dto.CouponValidationResult;
import com.mursalin.ecom.model.KbArticle;
import com.mursalin.ecom.model.KbTopic;
import com.mursalin.ecom.repository.KbArticleRepository;
import com.mursalin.ecom.service.CartService;
import com.mursalin.ecom.service.ShippingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportTools {

    private static final List<KbTopic> VALID_TOPICS = List.of(
            KbTopic.RETURNS, KbTopic.SHIPPING, KbTopic.PAYMENT, KbTopic.ACCOUNT, KbTopic.STORE_INFO, KbTopic.OTHER
    );

    private final CartService cartService;
    private final ShippingService shippingService;
    private final KbArticleRepository kbArticleRepository;

    public ToolResult<CouponValidationResponse> validateCoupon(String code, BigDecimal orderSubtotal) {
        if (code == null || code.isBlank()) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (orderSubtotal == null || orderSubtotal.compareTo(BigDecimal.ZERO) < 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            CouponValidationResult serviceResult = cartService.validateCoupon(code, orderSubtotal);
            CouponValidationResponse response = new CouponValidationResponse(
                    serviceResult.isValid(),
                    serviceResult.getDiscountType(),
                    serviceResult.getDiscountValue(),
                    serviceResult.getDiscountAmount(),
                    serviceResult.getMessage()
            );
            return ToolResult.success(response);
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<ShippingEstimateResult> getShippingEstimate(BigDecimal subtotal, String method) {
        if (subtotal == null || subtotal.compareTo(BigDecimal.ZERO) < 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (method == null || method.isBlank()) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        String normalizedMethod = method.toUpperCase();
        if (!"STANDARD".equals(normalizedMethod) && !"EXPRESS".equals(normalizedMethod)) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            BigDecimal shippingCost = shippingService.calculateShippingCost(subtotal, normalizedMethod, "BD");
            return ToolResult.success(new ShippingEstimateResult(shippingCost));
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<PolicyInfoResult> getPolicyInfo(String topic) {
        if (topic == null || topic.isBlank()) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        KbTopic kbTopic;
        try {
            kbTopic = KbTopic.valueOf(topic.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        if (!VALID_TOPICS.contains(kbTopic)) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            KbArticle article = kbArticleRepository.findByTopic(kbTopic).orElse(null);
            if (article == null || article.getContent() == null || article.getContent().isBlank()) {
                return ToolResult.failure(ToolErrorCode.UNAVAILABLE,
                        "No content configured for topic " + topic);
            }
            return ToolResult.success(new PolicyInfoResult(topic, article.getContent()));
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public record ShippingEstimateResult(BigDecimal shippingCost) {
    }

    public record PolicyInfoResult(String topic, String policyText) {
    }
}
