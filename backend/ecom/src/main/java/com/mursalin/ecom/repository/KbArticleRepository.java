package com.mursalin.ecom.repository;

import com.mursalin.ecom.model.KbArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KbArticleRepository extends JpaRepository<KbArticle, Long> {

    Optional<KbArticle> findByTopic(String topic);

    List<KbArticle> findAllByOrderByTopicAsc();
}
