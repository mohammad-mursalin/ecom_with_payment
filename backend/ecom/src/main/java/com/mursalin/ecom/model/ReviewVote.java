package com.mursalin.ecom.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"review_id", "user_id"})
})
@Data
public class ReviewVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewVoteType vote;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public ReviewVote() {
    }

    public ReviewVote(Long id, Review review, User user, ReviewVoteType vote) {
        this.id = id;
        this.review = review;
        this.user = user;
        this.vote = vote;
    }
}
