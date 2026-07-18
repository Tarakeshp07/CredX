package dev.credx.jobmatch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // bcrypt hash

    @Column(nullable = false)
    private String firstName = "";

    @Column(nullable = false)
    private String lastName = "";

    @Column(nullable = false)
    private String phone = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleName role = RoleName.STUDENT;

    // ---- Student profile fields (matching signal) ----
    private Double gpa;

    @Column(nullable = false)
    private String workAuthStatus = "UNKNOWN"; // CITIZEN | PERMANENT_RESIDENT | NEEDS_SPONSORSHIP | STUDENT_VISA | UNKNOWN

    private Integer experienceYears;

    @Column(nullable = false)
    private String desiredRole = "";

    @Column(nullable = false)
    private String preferredLocation = "";

    @Column(nullable = false)
    private boolean openToRemote = true;

    @Column(nullable = false)
    private boolean profileCompleted = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_skills",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private Set<Skill> skills = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
