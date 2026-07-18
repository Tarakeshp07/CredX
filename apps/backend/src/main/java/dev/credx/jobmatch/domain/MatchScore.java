package dev.credx.jobmatch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Cached Match Score per (user, job). Upserted on recompute. */
@Entity
@Table(name = "match_scores", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_id"}))
@Getter
@Setter
public class MatchScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(nullable = false)
    private double score; // 0..100

    @Column(nullable = false, columnDefinition = "text")
    private String breakdown = "{}"; // JSON string

    @Column(nullable = false)
    private Instant computedAt = Instant.now();
}
