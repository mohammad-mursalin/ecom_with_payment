package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.Product;
import com.mursalin.ecom.model.Review;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> isActiveAndVisible() {
        return (root, query, cb) -> cb.and(
                cb.isTrue(root.get("isActive")),
                cb.isNull(root.get("deletedAt"))
        );
    }

    public static Specification<Product> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            query.distinct(true);
            Join<Product, com.mursalin.ecom.model.Brand> brand = root.join("brandEntity", JoinType.LEFT);
            Join<Product, com.mursalin.ecom.model.Category> category = root.join("categoryEntity", JoinType.LEFT);
            String lowerKeyword = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), lowerKeyword),
                    cb.like(cb.lower(root.get("description")), lowerKeyword),
                    cb.like(cb.lower(brand.get("name")), lowerKeyword),
                    cb.like(cb.lower(category.get("name")), lowerKeyword)
            );
        };
    }

    public static Specification<Product> inCategoryIds(List<Long> categoryIds) {
        return (root, query, cb) -> {
            if (categoryIds == null || categoryIds.isEmpty()) {
                return cb.conjunction();
            }
            return root.get("categoryEntity").get("id").in(categoryIds);
        };
    }

    public static Specification<Product> inBrandIds(List<Long> brandIds) {
        return (root, query, cb) -> {
            if (brandIds == null || brandIds.isEmpty()) {
                return cb.conjunction();
            }
            return root.get("brandEntity").get("id").in(brandIds);
        };
    }

    public static Specification<Product> priceBetween(BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();
            if (minPrice != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            return predicate;
        };
    }

    public static Specification<Product> hasMinAverageRating(Integer minRating) {
        return (root, query, cb) -> {
            Subquery<Double> subquery = query.subquery(Double.class);
            Root<Review> reviewRoot = subquery.from(Review.class);
            subquery.select(cb.avg(reviewRoot.get("rating")));
            subquery.where(cb.equal(reviewRoot.get("product").get("id"), root.get("id")));
            return cb.greaterThanOrEqualTo(subquery, minRating.doubleValue());
        };
    }
}
