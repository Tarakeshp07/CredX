package dev.credx.jobmatch.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.credx.jobmatch.domain.Job;
import dev.credx.jobmatch.domain.MatchScore;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.JobDtos.JobFilter;
import dev.credx.jobmatch.dto.MatchDtos.*;
import dev.credx.jobmatch.repo.ApplicationRepository;
import dev.credx.jobmatch.repo.JobRepository;
import dev.credx.jobmatch.repo.MatchScoreRepository;
import dev.credx.jobmatch.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class MatchService {

    private final UserRepository users;
    private final JobRepository jobs;
    private final JobService jobService;
    private final ScoringService scoring;
    private final MatchScoreRepository matchScores;
    private final ApplicationRepository applications;
    private final ObjectMapper objectMapper;

    public MatchService(UserRepository users, JobRepository jobs, JobService jobService,
                        ScoringService scoring, MatchScoreRepository matchScores,
                        ApplicationRepository applications, ObjectMapper objectMapper) {
        this.users = users;
        this.jobs = jobs;
        this.jobService = jobService;
        this.scoring = scoring;
        this.matchScores = matchScores;
        this.applications = applications;
        this.objectMapper = objectMapper;
    }

    private User loadStudent(Long userId) {
        return users.findWithSkillsById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void upsert(User user, Job job, ScoreBreakdown b) {
        MatchScore ms = matchScores.findByUserIdAndJobId(user.getId(), job.getId()).orElseGet(MatchScore::new);
        ms.setUser(user);
        ms.setJob(job);
        ms.setScore(b.score());
        try {
            ms.setBreakdown(objectMapper.writeValueAsString(b));
        } catch (Exception e) {
            ms.setBreakdown("{}");
        }
        ms.setComputedAt(java.time.Instant.now());
        matchScores.save(ms);
    }

    @Transactional
    public MatchListResponse getMatches(Long userId, JobFilter filter) {
        User student = loadStudent(userId);
        List<Job> candidates = jobService.findActiveMatching(filter);

        Set<Long> appliedJobIds = new HashSet<>();
        applications.findByUserIdOrderByAppliedAtDesc(userId)
                .forEach(a -> appliedJobIds.add(a.getJob().getId()));

        record Scored(Job job, ScoreBreakdown b) {}
        List<Scored> scored = new ArrayList<>();
        for (Job job : candidates) {
            ScoreBreakdown b = scoring.score(student, job);
            if (b.hardPass()) scored.add(new Scored(job, b));
        }
        scored.sort(Comparator.comparingInt((Scored s) -> s.b().score()).reversed());

        List<MatchItem> items = new ArrayList<>();
        for (Scored s : scored) {
            upsert(student, s.job(), s.b());
            items.add(new MatchItem(
                    Mappers.job(s.job()),
                    s.b().score(),
                    s.b().band(),
                    s.b().matchedSkills(),
                    s.b().missingSkills(),
                    appliedJobIds.contains(s.job().getId())));
        }
        return new MatchListResponse(items.size(), items);
    }

    @Transactional
    public ScoreResult scoreOne(Long userId, Long jobId) {
        User student = loadStudent(userId);
        Job job = jobs.findWithSkillsById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        ScoreBreakdown b = scoring.score(student, job);
        upsert(student, job, b);
        return new ScoreResult(Mappers.job(job), b);
    }
}
