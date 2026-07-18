package dev.credx.jobmatch.dto;

import jakarta.validation.constraints.*;

import java.util.List;

public class ProfileDtos {

    public record SkillDto(Long id, String name) {}

    public record ProfileDto(
            Long id,
            String email,
            String firstName,
            String lastName,
            String phone,
            String role,
            Double gpa,
            String workAuthStatus,
            Integer experienceYears,
            String desiredRole,
            String preferredLocation,
            boolean openToRemote,
            boolean profileCompleted,
            List<SkillDto> skills
    ) {}

    public record UpdateProfileRequest(
            String firstName,
            String lastName,
            String phone,
            @DecimalMin("0.0") @DecimalMax("10.0") Double gpa,
            @Pattern(regexp = "CITIZEN|PERMANENT_RESIDENT|NEEDS_SPONSORSHIP|STUDENT_VISA|UNKNOWN")
            String workAuthStatus,
            @Min(0) @Max(50) Integer experienceYears,
            String desiredRole,
            String preferredLocation,
            Boolean openToRemote,
            List<String> skills
    ) {}
}
