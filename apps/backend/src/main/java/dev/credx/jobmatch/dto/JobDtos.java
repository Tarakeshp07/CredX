package dev.credx.jobmatch.dto;

import dev.credx.jobmatch.dto.ProfileDtos.SkillDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public class JobDtos {

    public record JobDto(
            Long id,
            String title,
            String description,
            String company,
            String roleType,
            String employmentType,
            String location,
            String remoteMode,
            boolean visaSponsorship,
            Double minGpa,
            int minExperience,
            String status,
            List<SkillDto> requiredSkills
    ) {}

    public record JobFilter(
            String search,
            String roleType,
            String location,
            String remoteMode,
            String employmentType,
            Boolean visaSponsorship
    ) {}

    public record CreateJobRequest(
            @NotBlank String title,
            String description,
            String company,
            String roleType,
            @Pattern(regexp = "FULL_TIME|INTERNSHIP|PART_TIME") String employmentType,
            String location,
            @Pattern(regexp = "ONSITE|REMOTE|HYBRID") String remoteMode,
            Boolean visaSponsorship,
            Double minGpa,
            Integer minExperience,
            List<String> skills
    ) {}
}
