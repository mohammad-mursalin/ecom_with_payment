package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.dto.KbArticleResponse;
import com.mursalin.ecom.dto.KbArticleUpdateRequest;
import com.mursalin.ecom.exception.BadRequestException;
import com.mursalin.ecom.model.KbArticle;
import com.mursalin.ecom.model.KbTopic;
import com.mursalin.ecom.repository.KbArticleRepository;
import com.mursalin.ecom.service.KbService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KbServiceImpl implements KbService {

    private final KbArticleRepository kbArticleRepository;

    @Override
    public List<KbArticleResponse> getAllTopics() {
        return Arrays.stream(KbTopic.values())
                .map(topic -> {
                    Optional<KbArticle> articleOpt = kbArticleRepository.findByTopic(topic);
                    if (articleOpt.isPresent()) {
                        KbArticle article = articleOpt.get();
                        return new KbArticleResponse(article.getTopic(), article.getContent(), article.getUpdatedAt());
                    } else {
                        return new KbArticleResponse(topic, "", null);
                    }
                })
                .toList();
    }

    @Override
    public KbArticleResponse updateTopic(KbTopic topic, KbArticleUpdateRequest request) {
        String content = request.getContent();
        if (content != null && content.length() > 2000) {
            throw new BadRequestException("Content must not exceed 2000 characters");
        }

        KbArticle article;
        Optional<KbArticle> existing = kbArticleRepository.findByTopic(topic);
        if (existing.isPresent()) {
            article = existing.get();
            article.setContent(content);
            article.setUpdatedAt(LocalDateTime.now());
        } else {
            article = new KbArticle();
            article.setTopic(topic);
            article.setContent(content);
            article.setCreatedAt(LocalDateTime.now());
            article.setUpdatedAt(LocalDateTime.now());
        }
        article = kbArticleRepository.save(article);
        return new KbArticleResponse(article.getTopic(), article.getContent(), article.getUpdatedAt());
    }
}
