package dev.credx.jobmatch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "jobs", indexes = {
        @Index(name = "idx_job_status", columnList = "status"),
        @Index(name = "idx_job_roletype", columnList = "roleType")
})
@Getter
@Setter
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description = "";

    @Column(nullable = false)
    private String company = "";

    @Column(nullable = false)
    private String roleType = "";

    @Column(nullable = false)
    private String employmentType = "FULL_TIME"; // FULL_TIME | INTERNSHIP | PART_TIME

    @Column(nullable = false)
    private String location = "";

    @Column(nullable = false)
    private String remoteMode = "ONSITE"; // ONSITE | REMOTE | HYBRID

    @Column(nullable = false)
    private boolean visaSponsorship = false;

    private Double minGpa;

    @Column(nullable = false)
    private int minExperience = 0;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE | EXPIRED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by_id")
    private User postedBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "job_skills",
            joinColumns = @JoinColumn(name = "job_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private Set<Skill> requiredSkills = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
