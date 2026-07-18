package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.Application;
import dev.credx.jobmatch.domain.Job;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.ApplicationDtos.ApplicationDto;
import dev.credx.jobmatch.dto.ApplicationDtos.JobBrief;
import dev.credx.jobmatch.repo.ApplicationRepository;
import dev.credx.jobmatch.repo.JobRepository;
import dev.credx.jobmatch.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applications;
    private final JobRepository jobs;
    private final UserRepository users;

    public ApplicationService(ApplicationRepository applications, JobRepository jobs, UserRepository users) {
        this.applications = applications;
        this.jobs = jobs;
        this.users = users;
    }

    @Transactional
    public void apply(Long userId, Long jobId) {
        if (applications.existsByUserIdAndJobId(userId, jobId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already applied to this job");
        }
        Job job = jobs.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        User user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        Application a = new Application();
        a.setUser(user);
        a.setJob(job);
        applications.save(a);
    }

    @Transactional
    public void withdraw(Long userId, Long jobId) {
        Application a = applications.findByUserIdAndJobId(userId, jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        applications.delete(a);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> list(Long userId) {
        return applications.findByUserIdOrderByAppliedAtDesc(userId).stream()
                .map(a -> {
                    Job j = a.getJob();
                    return new ApplicationDto(a.getId(), a.getStatus(), a.getAppliedAt(),
                            new JobBrief(j.getId(), j.getTitle(), j.getCompany(), j.getLocation(), j.getRemoteMode()));
                })
                .toList();
    }
}
