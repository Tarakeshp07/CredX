package dev.credx.jobmatch.repo;

import dev.credx.jobmatch.domain.MatchScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MatchScoreRepository extends JpaRepository<MatchScore, Long> {
    Optional<MatchScore> findByUserIdAndJobId(Long userId, Long jobId);
    void deleteByUserId(Long userId);
    void deleteByJobId(Long jobId);
}
