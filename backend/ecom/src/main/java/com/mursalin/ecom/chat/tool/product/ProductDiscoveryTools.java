package com.mursalin.ecom.chat.tool.product;

import com.mursalin.ecom.chat.tool.ToolErrorCode;
import com.mursalin.ecom.chat.tool.ToolResult;
import com.mursalin.ecom.dto.PaginatedResponse;
import com.mursalin.ecom.dto.ProductResponse;
import com.mursalin.ecom.exception.ResourceNotFoundException;
import com.mursalin.ecom.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProductDiscoveryTools {

    private static final List<String> VALID_SORT_VALUES = List.of(
            "newest", "price_asc", "price_desc", "popular", "rating"
    );

    private final ProductService productService;

    public ToolResult<ProductSearchResponse> searchProducts(
            String keyword,
            String[] categories,
            String[] brands,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minRating,
            String sort
    ) {
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (minRating != null && (minRating < 1 || minRating > 5)) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (sort != null && !VALID_SORT_VALUES.contains(sort.toLowerCase(Locale.ROOT))) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        if (categories != null) {
            for (String c : categories) {
                if (c == null || c.isBlank()) {
                    return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
                }
            }
        }
        if (brands != null) {
            for (String b : brands) {
                if (b == null || b.isBlank()) {
                    return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
                }
            }
        }

        try {
            List<String> categoryList = categories != null ? Arrays.asList(categories) : Collections.emptyList();
            List<String> brandList = brands != null ? Arrays.asList(brands) : Collections.emptyList();

            PaginatedResponse<ProductResponse> page = productService.getFilteredProducts(
                    0, 6, keyword, categoryList, brandList, minPrice, maxPrice, minRating, sort, null
            );

            List<ProductSummaryDTO> items = page.getContent().stream()
                    .map(this::toSummaryDTO)
                    .toList();

            return ToolResult.success(new ProductSearchResponse(page.getTotalElements(), items));
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<ProductDetailDTO> getProductDetails(Long productId) {
        if (productId == null || productId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            ProductResponse response = productService.getProductById(productId);
            if (response == null) {
                return ToolResult.failure(ToolErrorCode.NOT_FOUND);
            }
            return ToolResult.success(toDetailDTO(response));
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<List<Object>> compareProducts(long[] productIds) {
        if (productIds == null || productIds.length < 2 || productIds.length > 4) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        List<Object> results = new java.util.ArrayList<>();
        for (long rawId : productIds) {
            Long id = rawId;
            try {
                ProductResponse response = productService.getProductById(id);
                if (response == null) {
                    results.add(new CompareNotFoundEntry(id));
                } else {
                    results.add(toDetailDTO(response));
                }
            } catch (Exception e) {
                results.add(new CompareNotFoundEntry(id));
            }
        }

        return ToolResult.success(results);
    }

    public ToolResult<List<ProductSummaryDTO>> getRelatedProducts(Long productId) {
        if (productId == null || productId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            List<ProductResponse> related = productService.getRelatedProducts(productId);
            List<ProductSummaryDTO> items = related.stream()
                    .map(this::toSummaryDTO)
                    .toList();
            return ToolResult.success(items);
        } catch (ResourceNotFoundException e) {
            return ToolResult.failure(ToolErrorCode.NOT_FOUND);
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    public ToolResult<List<ProductSummaryDTO>> getAlsoBoughtProducts(Long productId) {
        if (productId == null || productId <= 0) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }

        try {
            List<ProductResponse> related = productService.getAlsoBoughtProducts(productId);
            List<ProductSummaryDTO> items = related.stream()
                    .map(this::toSummaryDTO)
                    .toList();
            return ToolResult.success(items);
        } catch (ResourceNotFoundException e) {
            return ToolResult.failure(ToolErrorCode.NOT_FOUND);
        } catch (Exception e) {
            return ToolResult.failure(ToolErrorCode.UNAVAILABLE);
        }
    }

    private ProductSummaryDTO toSummaryDTO(ProductResponse response) {
        boolean inStock = response.getStock() != null
                && response.getStock() > 0
                && Boolean.TRUE.equals(response.getIsActive());

        return new ProductSummaryDTO(
                response.getId(),
                response.getName(),
                response.getPrice(),
                response.getOriginalPrice(),
                response.getAverageRating(),
                response.getReviewCount(),
                response.getPrimaryImageUrl(),
                response.getBrand() != null ? response.getBrand().getName() : null,
                response.getCategory() != null ? response.getCategory().getName() : null,
                inStock
        );
    }

    private ProductDetailDTO toDetailDTO(ProductResponse response) {
        boolean inStock = response.getStock() != null
                && response.getStock() > 0
                && Boolean.TRUE.equals(response.getIsActive());

        List<ProductSpecEntry> specs = response.getSpecs() != null
                ? response.getSpecs().stream()
                .map(s -> new ProductSpecEntry(s.getSpecKey(), s.getSpecValue()))
                .toList()
                : Collections.emptyList();

        List<String> tags = response.getTags() != null ? response.getTags() : Collections.emptyList();

        return new ProductDetailDTO(
                response.getId(),
                response.getName(),
                response.getDescription(),
                response.getPrice(),
                response.getOriginalPrice(),
                response.getAverageRating(),
                response.getReviewCount(),
                response.getPrimaryImageUrl(),
                response.getBrand() != null ? response.getBrand().getName() : null,
                response.getCategory() != null ? response.getCategory().getName() : null,
                response.getStock(),
                inStock,
                specs,
                tags
        );
    }

    public record ProductSummaryDTO(
            Long id,
            String name,
            BigDecimal price,
            BigDecimal originalPrice,
            Double averageRating,
            Long reviewCount,
            String primaryImageUrl,
            String brand,
            String category,
            boolean inStock
    ) {
    }

    public record ProductDetailDTO(
            Long id,
            String name,
            String description,
            BigDecimal price,
            BigDecimal originalPrice,
            Double averageRating,
            Long reviewCount,
            String primaryImageUrl,
            String brand,
            String category,
            Long stock,
            boolean inStock,
            List<ProductSpecEntry> specs,
            List<String> tags
    ) {
    }

    public record ProductSpecEntry(
            String specKey,
            String specValue
    ) {
    }

    public record ProductSearchResponse(
            long totalMatches,
            List<ProductSummaryDTO> items
    ) {
    }

    public record CompareNotFoundEntry(
            Long id,
            String error
    ) {
        public CompareNotFoundEntry(Long id) {
            this(id, "NOT_FOUND");
        }
    }
}
