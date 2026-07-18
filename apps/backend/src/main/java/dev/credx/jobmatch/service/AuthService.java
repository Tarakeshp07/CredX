package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.RoleName;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.AuthDtos.*;
import dev.credx.jobmatch.repo.UserRepository;
import dev.credx.jobmatch.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    private UserSummary summary(User u) {
        return new UserSummary(u.getId(), u.getEmail(), u.getRole().name(), u.getFirstName(), u.getLastName());
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        u.setEmail(req.email());
        u.setPassword(encoder.encode(req.password()));
        u.setFirstName(req.firstName() == null ? "" : req.firstName());
        u.setLastName(req.lastName() == null ? "" : req.lastName());
        u.setRole("RECRUITER".equalsIgnoreCase(req.role()) ? RoleName.RECRUITER : RoleName.STUDENT);
        users.save(u);
        return new AuthResponse(jwt.generateToken(u), summary(u));
    }

    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(req.password(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return new AuthResponse(jwt.generateToken(u), summary(u));
    }

    public UserSummary me(Long userId) {
        User u = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        return summary(u);
    }
}
