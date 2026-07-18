package dev.credx.jobmatch.web;

import dev.credx.jobmatch.dto.JobDtos.JobFilter;
import dev.credx.jobmatch.dto.MatchDtos.MatchListResponse;
import dev.credx.jobmatch.dto.MatchDtos.ScoreResult;
import dev.credx.jobmatch.service.MatchService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/matches")
@PreAuthorize("hasRole('STUDENT')")
public class MatchController {

    private final MatchService matches;

    public MatchController(MatchService matches) {
        this.matches = matches;
    }

    @GetMapping
    public MatchListResponse getMatches(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String roleType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String remoteMode,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) Boolean visaSponsorship) {
        return matches.getMatches(userId,
                new JobFilter(search, roleType, location, remoteMode, employmentType, visaSponsorship));
    }

    @GetMapping("/{jobId}/score")
    public ScoreResult scoreOne(@AuthenticationPrincipal Long userId, @PathVariable Long jobId) {
        return matches.scoreOne(userId, jobId);
    }
}
