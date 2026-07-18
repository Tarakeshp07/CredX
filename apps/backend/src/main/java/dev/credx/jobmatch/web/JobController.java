package dev.credx.jobmatch.web;

import dev.credx.jobmatch.dto.JobDtos.CreateJobRequest;
import dev.credx.jobmatch.dto.JobDtos.JobDto;
import dev.credx.jobmatch.dto.JobDtos.JobFilter;
import dev.credx.jobmatch.service.JobService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/jobs")
public class JobController {

    private final JobService jobs;

    public JobController(JobService jobs) {
        this.jobs = jobs;
    }

    @GetMapping
    public List<JobDto> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String roleType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String remoteMode,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) Boolean visaSponsorship) {
        return jobs.list(new JobFilter(search, roleType, location, remoteMode, employmentType, visaSponsorship));
    }

    @GetMapping("/{id}")
    public JobDto get(@PathVariable Long id) {
        return jobs.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECRUITER','ADMIN')")
    public JobDto create(@Valid @RequestBody CreateJobRequest req, @AuthenticationPrincipal Long userId) {
        return jobs.create(req, userId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECRUITER','ADMIN')")
    public void delete(@PathVariable Long id) {
        jobs.delete(id);
    }
}
