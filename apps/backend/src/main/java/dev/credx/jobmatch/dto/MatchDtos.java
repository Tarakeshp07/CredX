package dev.credx.jobmatch.dto;

import dev.credx.jobmatch.dto.JobDtos.JobDto;

import java.util.List;
import java.util.Map;

public class MatchDtos {

    public record ScoreBreakdown(
            boolean hardPass,
            String hardReason,
            int score,
            String band,
            Map<String, Double> factors,
            List<String> matchedSkills,
            List<String> missingSkills
    ) {}

    public record MatchItem(
            JobDto job,
            int matchScore,
            String band,
            List<String> matchedSkills,
            List<String> missingSkills,
            boolean applied
    ) {}

    public record MatchListResponse(int count, List<MatchItem> items) {}

    public record ScoreResult(JobDto job, ScoreBreakdown breakdown) {}
}
