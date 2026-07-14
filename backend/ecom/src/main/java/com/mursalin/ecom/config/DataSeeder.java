package com.mursalin.ecom.config;

import com.mursalin.ecom.repository.BrandRepository;
import com.mursalin.ecom.repository.CategoryRepository;
import com.mursalin.ecom.repository.KbArticleRepository;
import com.mursalin.ecom.model.Brand;
import com.mursalin.ecom.model.Category;
import com.mursalin.ecom.model.KbArticle;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder {

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final KbArticleRepository kbArticleRepository;

    public DataSeeder(CategoryRepository categoryRepository, BrandRepository brandRepository, KbArticleRepository kbArticleRepository) {
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.kbArticleRepository = kbArticleRepository;
    }

    @PostConstruct
    public void seed() {
        seedCategories();
        seedBrands();
        seedKbArticles();
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

    private void seedKbArticles() {
        if (kbArticleRepository.count() > 0) return;
        String[][] data = {
                {"RETURNS", "You can cancel your order for free as long as it's still Pending or Confirmed. If you cancel a Confirmed order, we'll process it as a refund instead of a straight cancellation, since payment has already been captured at that point. Orders that have already shipped or been delivered can't be cancelled from your order page.\n\nIf you'd like to return a delivered item, you have 30 days from the delivery date to start a return. Items must be unused, undamaged, and in their original packaging. If the item arrived defective or isn't what you ordered, return shipping is on us; otherwise, return shipping costs are the customer's responsibility. Once we receive and inspect your return, we'll process your refund, which moves through Refund Requested, Refund Processing, and Refunded."},
                {"SHIPPING", "We offer two shipping methods: Standard and Express. Orders with a subtotal of ₹200 or more ship free; otherwise a flat fee applies based on the method you choose. We currently ship within Bangladesh only.\n\nStandard shipping typically takes 3–5 business days, and Express shipping typically takes 1–2 business days, from the time your order is confirmed. Once your order ships, we'll attach a tracking number and carrier so you can follow its progress."},
                {"PAYMENT", "We accept all major credit and debit cards — Visa, Mastercard, and American Express — processed securely through Stripe. Your payment is authorized when you place your order and captured once it's confirmed. If a payment fails, you can retry with the same or a different card from checkout."},
                {"ACCOUNT", "You can update your username, email, full name, phone number, address, and bio anytime from your Profile page. Changing your email requires the new one not already be in use.\n\nTo change your password, you'll provide your current password along with a new one — the new password must differ from your current one and be at least 8 characters.\n\nYou can delete your account from your Profile page by confirming your exact username. Your account will be deactivated and your order history preserved for our records, but you won't be able to log in afterward. This can't be undone through the site — you'd need to create a new account to shop with us again."},
                {"STORE_INFO", "Welcome to Mursalin — your online store for quality products at great prices. If you have any questions we haven't covered here, our support team is happy to help at support@mursalin.com. We're generally available Monday through Saturday, 9 AM to 6 PM."},
                {"OTHER", ""}
        };
        for (String[] row : data) {
            KbArticle article = new KbArticle();
            article.setTopic(row[0]);
            article.setContent(row[1]);
            kbArticleRepository.save(article);
        }
    }
}
