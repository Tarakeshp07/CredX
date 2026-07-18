package dev.credx.jobmatch.repo;

import dev.credx.jobmatch.domain.Job;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    @EntityGraph(attributePaths = "requiredSkills")
    Optional<Job> findWithSkillsById(Long id);

    @EntityGraph(attributePaths = "requiredSkills")
    List<Job> findAllWithSkillsByStatus(String status);

    long countByTitleAndCompany(String title, String company);
}
