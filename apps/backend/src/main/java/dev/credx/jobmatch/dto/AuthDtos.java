package dev.credx.jobmatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6) String password,
            String firstName,
            String lastName,
            String role // "STUDENT" | "RECRUITER"; defaults to STUDENT
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record UserSummary(Long id, String email, String role, String firstName, String lastName) {}

    public record AuthResponse(String accessToken, UserSummary user) {}
}
