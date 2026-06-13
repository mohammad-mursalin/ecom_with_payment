package com.mursalin.ecom.config;

import com.mursalin.ecom.repository.BrandRepository;
import com.mursalin.ecom.repository.CategoryRepository;
import com.mursalin.ecom.model.Brand;
import com.mursalin.ecom.model.Category;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder {

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    public DataSeeder(CategoryRepository categoryRepository, BrandRepository brandRepository) {
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
    }

    @PostConstruct
    public void seed() {
        seedCategories();
        seedBrands();
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;
        String[][] data = {
                {"Laptops", "laptops", "💻", "Powerful laptops for work and play"},
                {"Headphones", "headphones", "🎧", "Immerse yourself in premium audio"},
                {"Mobile", "mobile", "📱", "Latest smartphones and accessories"},
                {"Electronics", "electronics", "⚡", "Wide range of electronic gadgets"}
        };
        for (String[] row : data) {
            Category category = new Category();
            category.setName(row[0]);
            category.setSlug(row[1]);
            category.setIcon(row[2]);
            category.setDescription(row[3]);
            categoryRepository.save(category);
        }
    }

    private void seedBrands() {
        if (brandRepository.count() > 0) return;
        String[][] data = {
                {"Apple", "apple"},
                {"Samsung", "samsung"},
                {"Sony", "sony"},
                {"Boat", "boat"}
        };
        for (String[] row : data) {
            Brand brand = new Brand();
            brand.setName(row[0]);
            brand.setSlug(row[1]);
            brandRepository.save(brand);
        }
    }
}
