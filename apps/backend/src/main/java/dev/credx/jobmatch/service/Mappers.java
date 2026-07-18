package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.Job;
import dev.credx.jobmatch.domain.Skill;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.JobDtos.JobDto;
import dev.credx.jobmatch.dto.ProfileDtos.ProfileDto;
import dev.credx.jobmatch.dto.ProfileDtos.SkillDto;

import java.util.Comparator;
import java.util.List;

/** Entity -> DTO conversions. Skill lists are sorted by name for stable output. */
public final class Mappers {

    private Mappers() {}

    public static SkillDto skill(Skill s) {
        return new SkillDto(s.getId(), s.getName());
    }

    public static List<SkillDto> skills(java.util.Collection<Skill> skills) {
        return skills.stream()
                .sorted(Comparator.comparing(Skill::getName))
                .map(Mappers::skill)
                .toList();
    }

    public static JobDto job(Job j) {
        return new JobDto(
                j.getId(), j.getTitle(), j.getDescription(), j.getCompany(), j.getRoleType(),
                j.getEmploymentType(), j.getLocation(), j.getRemoteMode(), j.isVisaSponsorship(),
                j.getMinGpa(), j.getMinExperience(), j.getStatus(), skills(j.getRequiredSkills()));
    }

    public static ProfileDto profile(User u) {
        return new ProfileDto(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), u.getPhone(),
                u.getRole().name(), u.getGpa(), u.getWorkAuthStatus(), u.getExperienceYears(),
                u.getDesiredRole(), u.getPreferredLocation(), u.isOpenToRemote(),
                u.isProfileCompleted(), skills(u.getSkills()));
    }
}
