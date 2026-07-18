package dev.credx.jobmatch.web;

import dev.credx.jobmatch.dto.ApplicationDtos.ApplicationDto;
import dev.credx.jobmatch.service.ApplicationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/applications")
@PreAuthorize("hasRole('STUDENT')")
public class ApplicationController {

    private final ApplicationService applications;

    public ApplicationController(ApplicationService applications) {
        this.applications = applications;
    }

    @GetMapping
    public List<ApplicationDto> list(@AuthenticationPrincipal Long userId) {
        return applications.list(userId);
    }

    @PostMapping("/{jobId}")
    public void apply(@AuthenticationPrincipal Long userId, @PathVariable Long jobId) {
        applications.apply(userId, jobId);
    }

    @DeleteMapping("/{jobId}")
    public void withdraw(@AuthenticationPrincipal Long userId, @PathVariable Long jobId) {
        applications.withdraw(userId, jobId);
    }
}
