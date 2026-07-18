package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.Job;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.JobDtos.CreateJobRequest;
import dev.credx.jobmatch.dto.JobDtos.JobDto;
import dev.credx.jobmatch.dto.JobDtos.JobFilter;
import dev.credx.jobmatch.repo.JobRepository;
import dev.credx.jobmatch.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class JobService {

    private final JobRepository jobs;
    private final UserRepository users;
    private final SkillService skillService;

    public JobService(JobRepository jobs, UserRepository users, SkillService skillService) {
        this.jobs = jobs;
        this.users = users;
        this.skillService = skillService;
    }

    /** Active jobs, narrowed by the dashboard filters (hard pre-filter). */
    @Transactional(readOnly = true)
    public List<Job> findActiveMatching(JobFilter f) {
        return jobs.findAllWithSkillsByStatus("ACTIVE").stream()
                .filter(j -> matches(j, f))
                .sorted(Comparator.comparing(Job::getCreatedAt).reversed())
                .toList();
    }

    private boolean matches(Job j, JobFilter f) {
        if (f == null) return true;
        if (has(f.roleType()) && !f.roleType().equalsIgnoreCase(j.getRoleType())) return false;
        if (has(f.remoteMode()) && !f.remoteMode().equalsIgnoreCase(j.getRemoteMode())) return false;
        if (has(f.employmentType()) && !f.employmentType().equalsIgnoreCase(j.getEmploymentType())) return false;
        if (f.visaSponsorship() != null && j.isVisaSponsorship() != f.visaSponsorship()) return false;
        if (has(f.location()) && !j.getLocation().toLowerCase().contains(f.location().toLowerCase())) return false;
        if (has(f.search())) {
            String s = f.search().toLowerCase();
            boolean hit = j.getTitle().toLowerCase().contains(s)
                    || j.getCompany().toLowerCase().contains(s)
                    || j.getDescription().toLowerCase().contains(s);
            if (!hit) return false;
        }
        return true;
    }

    private boolean has(String s) {
        return s != null && !s.isBlank();
    }

    @Transactional(readOnly = true)
    public List<JobDto> list(JobFilter f) {
        return findActiveMatching(f).stream().map(Mappers::job).toList();
    }

    @Transactional(readOnly = true)
    public JobDto get(Long id) {
        Job j = jobs.findWithSkillsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        return Mappers.job(j);
    }

    @Transactional
    public JobDto create(CreateJobRequest req, Long userId) {
        User poster = users.findById(userId).orElse(null);
        Job j = new Job();
        j.setTitle(req.title());
        j.setDescription(req.description() == null ? "" : req.description());
        j.setCompany(req.company() == null ? "" : req.company());
        j.setRoleType(req.roleType() == null ? "" : req.roleType());
        j.setEmploymentType(req.employmentType() == null ? "FULL_TIME" : req.employmentType());
        j.setLocation(req.location() == null ? "" : req.location());
        j.setRemoteMode(req.remoteMode() == null ? "ONSITE" : req.remoteMode());
        j.setVisaSponsorship(Boolean.TRUE.equals(req.visaSponsorship()));
        j.setMinGpa(req.minGpa());
        j.setMinExperience(req.minExperience() == null ? 0 : req.minExperience());
        j.setStatus("ACTIVE");
        j.setPostedBy(poster);
        j.getRequiredSkills().addAll(skillService.resolveMany(req.skills()));
        jobs.save(j);
        return Mappers.job(j);
    }

    @Transactional
    public void delete(Long id) {
        if (!jobs.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found");
        }
        jobs.deleteById(id);
    }
}
