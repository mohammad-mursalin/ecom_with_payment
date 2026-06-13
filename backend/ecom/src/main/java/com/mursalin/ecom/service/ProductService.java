package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.*;
import com.mursalin.ecom.model.*;
import com.mursalin.ecom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepo repo;
    private final ImageService imageService;
    private final ReviewRepository reviewRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductSpecRepository productSpecRepository;
    private final ProductTagRepository productTagRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final OrderItemRepository orderItemRepository;
    private final WishlistRepository wishlistRepository;

    public PaginatedResponse<ProductResponse> getProducts(int page, int size, String keyword, String category, Long userId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = repo.findWithFilters(normalize(keyword), pageable);
        List<ProductResponse> responseContent = productPage.getContent().stream()
                .map(p -> toProductResponse(p, userId))
                .collect(Collectors.toList());
        return new PaginatedResponse<>(responseContent, page, productPage.getTotalPages(), productPage.getTotalElements(), size, !productPage.hasPrevious(), !productPage.hasNext());
    }

    public PaginatedResponse<ProductResponse> getFilteredProducts(int page, int size, String search, List<String> categorySlugs, List<String> brandSlugs, BigDecimal minPrice, BigDecimal maxPrice, Integer minRating, String sort, Long userId) {
        Pageable pageable = createPageable(page, size, sort);
        String keyword = normalize(search);

        Page<Product> productPage;

if (!categorySlugs.isEmpty() || !brandSlugs.isEmpty()) {
             List<Category> matchedCategories = categorySlugs.isEmpty()
                     ? List.of()
                     : categorySlugs.stream()
                     .map(categoryRepository::findBySlug)
                     .filter(java.util.Objects::nonNull)
                     .collect(Collectors.toList());

             List<Brand> matchedBrands = brandSlugs.isEmpty()
                     ? List.of()
                     : brandSlugs.stream()
                     .map(brandRepository::findBySlug)
                     .filter(java.util.Objects::nonNull)
                     .collect(Collectors.toList());

             List<Long> categoryIds = matchedCategories.stream().map(Category::getId).toList();
             List<Long> brandIds = matchedBrands.stream().map(Brand::getId).toList();

             if (!categoryIds.isEmpty() || !brandIds.isEmpty()) {
                 productPage = repo.findByIsActiveTrueAndDeletedAtIsNull(pageable);
             } else {
                 productPage = repo.findWithFilters(keyword, pageable);
             }
         } else {
             productPage = repo.findByIsActiveTrueAndDeletedAtIsNull(pageable);
         }

        if (minPrice != null || maxPrice != null) {
            List<ProductResponse> filtered = productPage.getContent().stream()
                    .map(p -> toProductResponse(p, userId))
                    .filter(p -> (minPrice == null || p.getPrice().compareTo(minPrice) >= 0)
                            && (maxPrice == null || p.getPrice().compareTo(maxPrice) <= 0))
                    .collect(Collectors.toList());
            int totalElements = filtered.size();
            int start = page * size;
            int end = Math.min(start + size, totalElements);
            List<ProductResponse> pagedContent = start >= end ? List.of() : filtered.subList(start, end);
            int totalPages = (int) Math.ceil((double) totalElements / size);
            PaginatedResponse<ProductResponse> result = new PaginatedResponse<>(
                    pagedContent,
                    page,
                    totalPages,
                    totalElements,
                    size,
                    page == 0,
                    end >= totalElements
            );
            return result;
        }

        List<ProductResponse> responseContent = productPage.getContent().stream()
                .map(p -> toProductResponse(p, userId))
                .collect(Collectors.toList());
        return new PaginatedResponse<>(responseContent, page, productPage.getTotalPages(), productPage.getTotalElements(), size, !productPage.hasPrevious(), !productPage.hasNext());
    }

    public ProductResponse getProductById(Long prodId) {
        Product product = repo.findById(prodId).orElse(null);
        if (product == null) {
            return null;
        }
        return toProductResponse(product, null);
    }

    public Product getProductEntityById(Long prodId) {
        return repo.findById(prodId).orElse(null);
    }

    public List<ProductResponse> getRelatedProducts(Long productId) {
        Product product = repo.findById(productId).orElse(null);
        if (product == null) return new ArrayList<>();

        Long categoryId = product.getCategoryEntity() != null ? product.getCategoryEntity().getId() : null;

        List<Product> related;
        if (categoryId != null) {
            related = repo.findByCategoryEntity_IdAndIsActiveTrueAndDeletedAtIsNull(categoryId);
            related.removeIf(p -> p.getId().equals(productId));
            if (related.size() > 6) {
                related.sort((a, b) -> {
                    Double avgA = reviewRepository.getAverageRatingByProductId(a.getId());
                    Double avgB = reviewRepository.getAverageRatingByProductId(b.getId());
                    double ratingA = avgA != null ? avgA : 0.0;
                    double ratingB = avgB != null ? avgB : 0.0;
                    return Double.compare(ratingB, ratingA);
                });
                related = related.subList(0, Math.min(6, related.size()));
            }
        } else {
            related = List.of();
        }
        return related.stream().map(p -> toProductResponse(p, null)).collect(Collectors.toList());
    }

    public List<ProductResponse> getAlsoBoughtProducts(Long productId) {
        List<Long> coPurchasedIds = orderItemRepository.findCoPurchasedProductIds(productId);
        if (coPurchasedIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Product> products = repo.findAllById(coPurchasedIds).stream()
                .filter(p -> p.isActive() && p.getDeletedAt() == null && !p.getId().equals(productId))
                .toList();

        if (products.size() < 6) {
            List<ProductResponse> existing = products.stream()
                    .map(p -> toProductResponse(p, null))
                    .toList();

            Product product = repo.findById(productId).orElse(null);
            Long categoryId = product != null && product.getCategoryEntity() != null ? product.getCategoryEntity().getId() : null;

            if (categoryId != null) {
                List<Product> categoryProducts = repo.findByCategoryEntity_IdAndIsActiveTrueAndDeletedAtIsNull(categoryId);
                categoryProducts.removeIf(p -> p.getId().equals(productId));
                categoryProducts.removeAll(products);

                List<ProductResponse> filler = categoryProducts.stream()
                        .limit(6 - products.size())
                        .map(p -> toProductResponse(p, null))
                        .toList();

                List<ProductResponse> combined = new ArrayList<>(existing);
                combined.addAll(filler);
                return combined.stream().limit(6).toList();
            }
            return existing.stream().limit(6).toList();
        }

        return products.stream()
                .limit(6)
                .map(p -> toProductResponse(p, null))
                .toList();
    }

    public Product addProduct(Product product, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            com.mursalin.ecom.dto.ImageResponse image = imageService.uploadImage(imageFile);
            product.setImageUrl(image.getImageUrl());
            product.setDeleteHash(image.getDeleteHash());
        }
        return repo.save(product);
    }

    public Product updateProduct(Long id, Product product, MultipartFile imageFile) throws IOException {
        Product productDB = repo.findById(id).orElseThrow(() -> new RuntimeException("No product found with the id"));
        productDB.setProductAvailable(product.isProductAvailable());
        productDB.setName(product.getName());
        productDB.setBrandEntity(product.getBrandEntity());
        productDB.setCategoryEntity(product.getCategoryEntity());
        productDB.setPrice(product.getPrice());
        productDB.setDescription(product.getDescription());
        productDB.setReleaseDate(product.getReleaseDate());
        productDB.setStockQuantity(product.getStockQuantity());
        if (imageFile != null && !imageFile.isEmpty()) {
            imageService.deleteImage(productDB.getDeleteHash());
            ImageResponse image = imageService.uploadImage(imageFile);
            productDB.setImageUrl(image.getImageUrl());
            productDB.setDeleteHash(image.getDeleteHash());
        }
        return repo.save(productDB);
    }

    public void deleteProduct(Long id) {
        Product product = repo.findById(id).orElseThrow(() -> new RuntimeException("No product found with the id"));
        imageService.deleteImage(product.getDeleteHash());
        repo.deleteById(id);
    }

    public PaginatedResponse<AdminProductListResponse> getAdminProducts(String search, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        String keyword = normalize(search);
        Page<Product> productPage = repo.findAdminProducts(keyword, pageable);
        List<AdminProductListResponse> content = productPage.getContent().stream()
                .map(this::toAdminProductListResponse)
                .collect(Collectors.toList());
        return new PaginatedResponse<>(content, page, productPage.getTotalPages(), productPage.getTotalElements(), pageSize, !productPage.hasPrevious(), !productPage.hasNext());
    }

    public AdminProductListResponse toAdminProductListResponse(Product product) {
        AdminProductListResponse.CategoryInfo categoryInfo = null;
        if (product.getCategoryEntity() != null) {
            Category c = product.getCategoryEntity();
            categoryInfo = new AdminProductListResponse.CategoryInfo(c.getId(), c.getName(), c.getSlug());
        }

        AdminProductListResponse.BrandInfo brandInfo = null;
        if (product.getBrandEntity() != null) {
            Brand b = product.getBrandEntity();
            brandInfo = new AdminProductListResponse.BrandInfo(b.getId(), b.getName());
        }

        String primaryImageUrl = null;
        List<ProductImageResponse> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId()).stream()
                .map(img -> new ProductImageResponse(img.getId(), img.getUrl(), img.getSortOrder(), img.isPrimary()))
                .toList();
        if (images != null && !images.isEmpty()) {
            primaryImageUrl = images.get(0).getUrl();
        } else if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
            primaryImageUrl = product.getImageUrl();
        }

        Double avgRating = reviewRepository.getAverageRatingByProductId(product.getId());
        Long reviewCount = reviewRepository.countByProductId(product.getId());

        return new AdminProductListResponse(
                product.getId(),
                product.getName(),
                categoryInfo,
                brandInfo,
                product.getPrice(),
                product.getOriginalPrice(),
                product.getStockQuantity(),
                product.getLowStockThreshold(),
                product.isActive(),
                product.isFeatured(),
                primaryImageUrl,
                avgRating,
                reviewCount,
                product.getCreatedAt()
        );
    }

    public ProductResponse createAdminProduct(AdminProductRequest request, MultipartFile imageFile) throws Exception {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setLowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5);
        product.setActive(request.getIsActive());
        product.setFeatured(request.getIsFeatured());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategoryEntity(category);
        }

        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found"));
            product.setBrandEntity(brand);
        } else if (request.getBrandName() != null && !request.getBrandName().isBlank()) {
            Brand brand = brandRepository.findBySlug(request.getBrandName().toLowerCase().replaceAll("\\s+", "-"));
            if (brand == null) {
                brand = new Brand();
                brand.setName(request.getBrandName());
                brand.setSlug(request.getBrandName().toLowerCase().replaceAll("\\s+", "-"));
                brandRepository.save(brand);
            }
            product.setBrandEntity(brand);
        }

        Product savedProduct = repo.save(product);

        if (imageFile != null && !imageFile.isEmpty()) {
            com.mursalin.ecom.dto.ImageResponse image = imageService.uploadImage(imageFile);
            savedProduct.setImageUrl(image.getImageUrl());
            savedProduct.setDeleteHash(image.getDeleteHash());
            repo.save(savedProduct);
        }

        if (request.getTags() != null) {
            for (String tag : request.getTags()) {
                if (tag != null && !tag.isBlank()) {
                    ProductTag productTag = new ProductTag();
                    productTag.setProduct(savedProduct);
                    productTag.setTag(tag.trim());
                    productTagRepository.save(productTag);
                }
            }
        }

        if (request.getSpecs() != null) {
            for (AdminProductRequest.SpecItem spec : request.getSpecs()) {
                if (spec != null && spec.getSpecKey() != null && !spec.getSpecKey().isBlank()) {
                    ProductSpec productSpec = new ProductSpec();
                    productSpec.setProduct(savedProduct);
                    productSpec.setSpecKey(spec.getSpecKey().trim());
                    productSpec.setSpecValue(spec.getSpecValue() != null ? spec.getSpecValue().trim() : "");
                    productSpecRepository.save(productSpec);
                }
            }
        }

        return toProductResponse(savedProduct, null);
    }

    public ProductResponse updateAdminProduct(Long id, AdminProductRequest request, MultipartFile imageFile) throws Exception {
        Product productDB = repo.findById(id).orElseThrow(() -> new RuntimeException("No product found with the id"));

        productDB.setName(request.getName());
        productDB.setDescription(request.getDescription());
        productDB.setPrice(request.getPrice());
        productDB.setOriginalPrice(request.getOriginalPrice());
        productDB.setStockQuantity(request.getStockQuantity());
        productDB.setLowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5);
        productDB.setActive(request.getIsActive());
        productDB.setFeatured(request.getIsFeatured());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            productDB.setCategoryEntity(category);
        }

        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found"));
            productDB.setBrandEntity(brand);
        } else if (request.getBrandName() != null && !request.getBrandName().isBlank()) {
            Brand brand = brandRepository.findBySlug(request.getBrandName().toLowerCase().replaceAll("\\s+", "-"));
            if (brand == null) {
                brand = new Brand();
                brand.setName(request.getBrandName());
                brand.setSlug(request.getBrandName().toLowerCase().replaceAll("\\s+", "-"));
                brandRepository.save(brand);
            }
            productDB.setBrandEntity(brand);
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            if (productDB.getDeleteHash() != null) {
                imageService.deleteImage(productDB.getDeleteHash());
            }
            com.mursalin.ecom.dto.ImageResponse image = imageService.uploadImage(imageFile);
            productDB.setImageUrl(image.getImageUrl());
            productDB.setDeleteHash(image.getDeleteHash());
        }

        Product savedProduct = repo.save(productDB);

        productTagRepository.deleteByProductId(savedProduct.getId());
        if (request.getTags() != null) {
            for (String tag : request.getTags()) {
                if (tag != null && !tag.isBlank()) {
                    ProductTag productTag = new ProductTag();
                    productTag.setProduct(savedProduct);
                    productTag.setTag(tag.trim());
                    productTagRepository.save(productTag);
                }
            }
        }

        productSpecRepository.deleteByProductId(savedProduct.getId());
        if (request.getSpecs() != null) {
            for (AdminProductRequest.SpecItem spec : request.getSpecs()) {
                if (spec != null && spec.getSpecKey() != null && !spec.getSpecKey().isBlank()) {
                    ProductSpec productSpec = new ProductSpec();
                    productSpec.setProduct(savedProduct);
                    productSpec.setSpecKey(spec.getSpecKey().trim());
                    productSpec.setSpecValue(spec.getSpecValue() != null ? spec.getSpecValue().trim() : "");
                    productSpecRepository.save(productSpec);
                }
            }
        }

        return toProductResponse(savedProduct, null);
    }

    public ProductResponse toggleProductStatus(Long id, boolean isActive) {
        Product product = repo.findById(id).orElseThrow(() -> new RuntimeException("No product found with the id"));
        product.setActive(isActive);
        Product saved = repo.save(product);
        return toProductResponse(saved, null);
    }

    public PaginatedResponse<Product> searchProduct(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = repo.findWithFilters(normalize(keyword), pageable);
        return buildPaginatedResponse(productPage, page, size);
    }

    private Pageable createPageable(int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.DESC;
        String sortField = "createdAt";

        switch (sort != null ? sort : "newest") {
            case "price_asc":
                sortField = "price";
                direction = Sort.Direction.ASC;
                break;
            case "price_desc":
                sortField = "price";
                direction = Sort.Direction.DESC;
                break;
            case "popular":
                sortField = "id";
                direction = Sort.Direction.DESC;
                break;
            case "rating":
                sortField = "id";
                direction = Sort.Direction.DESC;
                break;
            case "newest":
            default:
                sortField = "createdAt";
                direction = Sort.Direction.DESC;
                break;
        }
        return PageRequest.of(page, size, Sort.by(direction, sortField));
    }

    private static final java.util.Map<String, String> CATEGORY_EMPTY_SLUGS = java.util.Collections.emptyMap();

    public ProductResponse toProductResponse(Product product, boolean isWishlisted) {
        List<ProductImageResponse> imageResponses;
        List<ProductImageResponse> dbImages = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId())
                .stream()
                .map(img -> new ProductImageResponse(img.getId(), img.getUrl(), img.getSortOrder(), img.isPrimary()))
                .toList();
        if (!dbImages.isEmpty()) {
            imageResponses = dbImages;
        } else {
            imageResponses = new ArrayList<>();
            String primaryUrl = product.getImageUrl();
            if (primaryUrl != null && !primaryUrl.isBlank()) {
                imageResponses.add(new ProductImageResponse(null, primaryUrl, 1, true));
            }
        }

        List<ProductSpecResponse> specResponses = productSpecRepository.findByProductId(product.getId()).stream()
                .map(s -> new ProductSpecResponse(s.getSpecKey(), s.getSpecValue()))
                .toList();

        List<String> tagList = productTagRepository.findByProductId(product.getId()).stream()
                .map(com.mursalin.ecom.model.ProductTag::getTag)
                .toList();

        ProductResponse.BrandInfo brandInfo = null;
        if (product.getBrandEntity() != null) {
            Brand b = product.getBrandEntity();
            brandInfo = new ProductResponse.BrandInfo(b.getId(), b.getName());
        }

        ProductResponse.CategoryInfo categoryInfo = null;
        if (product.getCategoryEntity() != null) {
            Category c = product.getCategoryEntity();
            categoryInfo = new ProductResponse.CategoryInfo(c.getId(), c.getName(), c.getSlug());
        }

        Double avgRating = reviewRepository.getAverageRatingByProductId(product.getId());
        Long reviewCount = reviewRepository.countByProductId(product.getId());

        BigDecimal originalPrice = product.getOriginalPrice();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                brandInfo,
                categoryInfo,
                product.getPrice(),
                originalPrice,
                product.getStockQuantity(),
                product.isActive(),
                product.isFeatured(),
                product.getImageUrl(),
                avgRating,
                reviewCount,
                imageResponses,
                specResponses,
                tagList,
                new ArrayList<>(),
                isWishlisted
        );
    }

    public ProductResponse toProductResponse(Product product, Long userId) {
        boolean isWishlisted = userId != null && wishlistRepository.existsByUserIdAndProductId(userId, product.getId());
        return toProductResponse(product, isWishlisted);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private PaginatedResponse<Product> buildPaginatedResponse(Page<Product> productPage, int page, int size) {
        return new PaginatedResponse<>(
                productPage.getContent(),
                page,
                productPage.getTotalPages(),
                productPage.getTotalElements(),
                size,
                !productPage.hasPrevious(),
                !productPage.hasNext()
        );
    }
}
