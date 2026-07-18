package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.Skill;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.ProfileDtos.ProfileDto;
import dev.credx.jobmatch.dto.ProfileDtos.UpdateProfileRequest;
import dev.credx.jobmatch.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Service
public class ProfileService {

    private final UserRepository users;
    private final SkillService skillService;

    public ProfileService(UserRepository users, SkillService skillService) {
        this.users = users;
        this.skillService = skillService;
    }

    @Transactional(readOnly = true)
    public ProfileDto get(Long userId) {
        User u = users.findWithSkillsById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return Mappers.profile(u);
    }

    @Transactional
    public ProfileDto update(Long userId, UpdateProfileRequest req) {
        User u = users.findWithSkillsById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (req.firstName() != null) u.setFirstName(req.firstName());
        if (req.lastName() != null) u.setLastName(req.lastName());
        if (req.phone() != null) u.setPhone(req.phone());
        if (req.gpa() != null) u.setGpa(req.gpa());
        if (req.workAuthStatus() != null) u.setWorkAuthStatus(req.workAuthStatus());
        if (req.experienceYears() != null) u.setExperienceYears(req.experienceYears());
        if (req.desiredRole() != null) u.setDesiredRole(req.desiredRole());
        if (req.preferredLocation() != null) u.setPreferredLocation(req.preferredLocation());
        if (req.openToRemote() != null) u.setOpenToRemote(req.openToRemote());

        if (req.skills() != null) {
            Set<Skill> resolved = skillService.resolveMany(req.skills());
            u.getSkills().clear();
            u.getSkills().addAll(resolved);
        }

        boolean completed = u.getGpa() != null
                && !"UNKNOWN".equals(u.getWorkAuthStatus())
                && !u.getSkills().isEmpty();
        u.setProfileCompleted(completed);

        users.save(u);
        return Mappers.profile(u);
    }
}
