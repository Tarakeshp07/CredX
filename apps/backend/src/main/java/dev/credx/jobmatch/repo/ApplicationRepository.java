package dev.credx.jobmatch.repo;

import dev.credx.jobmatch.domain.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByUserIdAndJobId(Long userId, Long jobId);
    List<Application> findByUserIdOrderByAppliedAtDesc(Long userId);
    boolean existsByUserIdAndJobId(Long userId, Long jobId);
}
