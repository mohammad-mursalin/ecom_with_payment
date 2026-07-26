package com.mursalin.ecom.service;

import com.mursalin.ecom.dto.KbArticleResponse;
import com.mursalin.ecom.dto.KbArticleUpdateRequest;
import com.mursalin.ecom.model.KbTopic;

import java.util.List;

public interface KbService {
    List<KbArticleResponse> getAllTopics();

    KbArticleResponse updateTopic(KbTopic topic, KbArticleUpdateRequest request);
}
