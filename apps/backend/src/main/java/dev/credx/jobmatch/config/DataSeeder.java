package dev.credx.jobmatch.config;

import dev.credx.jobmatch.domain.*;
import dev.credx.jobmatch.repo.JobRepository;
import dev.credx.jobmatch.repo.SkillRepository;
import dev.credx.jobmatch.repo.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {

    private final SkillRepository skills;
    private final JobRepository jobs;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DataSeeder(SkillRepository skills, JobRepository jobs, UserRepository users, PasswordEncoder encoder) {
        this.skills = skills;
        this.jobs = jobs;
        this.users = users;
        this.encoder = encoder;
    }

    private record SkillSeed(String name, String category, String synonyms) {}
    private record JobSeed(String title, String company, String roleType, String employmentType,
                           String location, String remoteMode, boolean visa, Double minGpa,
                           int minExp, String desc, List<String> skills) {}

    @Override
    public void run(String... args) {
        if (users.count() > 0) return; // already seeded

        // ---- Skills ----
        List<SkillSeed> skillSeeds = List.of(
                new SkillSeed("JavaScript", "Language", "js,ecmascript,es6"),
                new SkillSeed("TypeScript", "Language", "ts"),
                new SkillSeed("Python", "Language", "py"),
                new SkillSeed("Java", "Language", ""),
                new SkillSeed("SQL", "Database", "mysql,postgres,postgresql"),
                new SkillSeed("React", "Frontend", "reactjs,react.js"),
                new SkillSeed("Next.js", "Frontend", "nextjs,next"),
                new SkillSeed("Node.js", "Backend", "node,nodejs"),
                new SkillSeed("NestJS", "Backend", "nest"),
                new SkillSeed("Spring Boot", "Backend", "spring,springboot"),
                new SkillSeed("Docker", "DevOps", "containers"),
                new SkillSeed("Kubernetes", "DevOps", "k8s"),
                new SkillSeed("AWS", "Cloud", "amazon web services"),
                new SkillSeed("Machine Learning", "AI", "ml"),
                new SkillSeed("TensorFlow", "AI", "tf"),
                new SkillSeed("Pandas", "Data", ""),
                new SkillSeed("Git", "Tooling", "github,version control"),
                new SkillSeed("REST APIs", "Backend", "rest,restful,api"),
                new SkillSeed("GraphQL", "Backend", "gql"),
                new SkillSeed("HTML/CSS", "Frontend", "html,css,tailwind"));

        Map<String, Skill> byName = new HashMap<>();
        for (SkillSeed s : skillSeeds) {
            Skill skill = new Skill();
            skill.setName(s.name());
            skill.setCategory(s.category());
            skill.setSynonyms(s.synonyms());
            byName.put(s.name(), skills.save(skill));
        }

        // ---- Recruiter ----
        User recruiter = new User();
        recruiter.setEmail("recruiter@credx.dev");
        recruiter.setPassword(encoder.encode("password123"));
        recruiter.setFirstName("Rita");
        recruiter.setLastName("Recruiter");
        recruiter.setRole(RoleName.RECRUITER);
        users.save(recruiter);

        // ---- Jobs ----
        List<JobSeed> jobSeeds = List.of(
                new JobSeed("Backend Engineer Intern", "Nimbus Labs", "Backend", "INTERNSHIP", "Bengaluru", "HYBRID", false, 7.0, 0, "Build REST APIs with Node.js and SQL.", List.of("Node.js", "REST APIs", "SQL", "Git")),
                new JobSeed("Frontend Developer", "Pixelworks", "Frontend", "FULL_TIME", "Remote", "REMOTE", true, 6.5, 1, "React + Next.js product UI.", List.of("React", "Next.js", "TypeScript", "HTML/CSS")),
                new JobSeed("Full-Stack Engineer", "Stackforge", "Full-Stack", "FULL_TIME", "Hyderabad", "ONSITE", false, 7.0, 2, "End-to-end features across React and Node.", List.of("React", "Node.js", "TypeScript", "SQL", "REST APIs")),
                new JobSeed("Data Science Intern", "Quantum Analytics", "Data", "INTERNSHIP", "Remote", "REMOTE", false, 8.0, 0, "ML models with Python and Pandas.", List.of("Python", "Pandas", "Machine Learning")),
                new JobSeed("ML Engineer", "DeepMind Systems", "AI", "FULL_TIME", "London", "HYBRID", true, 8.0, 3, "Production ML with TensorFlow.", List.of("Python", "Machine Learning", "TensorFlow", "AWS")),
                new JobSeed("Java Backend Developer", "Enterprise Soft", "Backend", "FULL_TIME", "Pune", "ONSITE", false, 6.5, 2, "Spring Boot microservices.", List.of("Java", "Spring Boot", "SQL", "REST APIs")),
                new JobSeed("DevOps Intern", "CloudScale", "DevOps", "INTERNSHIP", "Remote", "REMOTE", false, 7.0, 0, "Docker + Kubernetes pipelines on AWS.", List.of("Docker", "Kubernetes", "AWS", "Git")),
                new JobSeed("Node.js API Developer", "Apiary", "Backend", "FULL_TIME", "Chennai", "HYBRID", false, 6.0, 1, "NestJS + GraphQL services.", List.of("Node.js", "NestJS", "GraphQL", "TypeScript")),
                new JobSeed("Junior Frontend Intern", "Bright UI", "Frontend", "INTERNSHIP", "Remote", "REMOTE", false, 6.0, 0, "Build UI with React and Tailwind.", List.of("React", "JavaScript", "HTML/CSS")),
                new JobSeed("Cloud Engineer", "SkyOps", "Cloud", "FULL_TIME", "Berlin", "HYBRID", true, 7.0, 3, "AWS infra with Docker/K8s.", List.of("AWS", "Docker", "Kubernetes", "Python")),
                new JobSeed("Software Engineer (New Grad)", "Foundry", "Full-Stack", "FULL_TIME", "Bengaluru", "ONSITE", false, 7.5, 0, "General SWE across the stack.", List.of("JavaScript", "SQL", "Git", "REST APIs")),
                new JobSeed("Data Analyst Intern", "InsightCo", "Data", "INTERNSHIP", "Mumbai", "HYBRID", false, 7.0, 0, "SQL + Python analytics.", List.of("SQL", "Python", "Pandas")),
                new JobSeed("Platform Engineer", "Corelayer", "Backend", "FULL_TIME", "Remote", "REMOTE", true, 7.0, 4, "Node + Kubernetes platform.", List.of("Node.js", "Kubernetes", "Docker", "TypeScript", "AWS")),
                new JobSeed("GraphQL Backend Intern", "Graphly", "Backend", "INTERNSHIP", "Remote", "REMOTE", false, 6.5, 0, "Build GraphQL APIs in NestJS.", List.of("GraphQL", "NestJS", "Node.js", "TypeScript")),
                new JobSeed("Senior React Engineer", "Vantage", "Frontend", "FULL_TIME", "San Francisco", "HYBRID", true, 7.0, 5, "Lead React/Next architecture.", List.of("React", "Next.js", "TypeScript", "GraphQL", "HTML/CSS")));

        for (JobSeed j : jobSeeds) {
            Job job = new Job();
            job.setTitle(j.title());
            job.setCompany(j.company());
            job.setRoleType(j.roleType());
            job.setEmploymentType(j.employmentType());
            job.setLocation(j.location());
            job.setRemoteMode(j.remoteMode());
            job.setVisaSponsorship(j.visa());
            job.setMinGpa(j.minGpa());
            job.setMinExperience(j.minExp());
            job.setDescription(j.desc());
            job.setStatus("ACTIVE");
            job.setPostedBy(recruiter);
            for (String sk : j.skills()) {
                Skill skill = byName.get(sk);
                if (skill != null) job.getRequiredSkills().add(skill);
            }
            jobs.save(job);
        }

        // ---- Demo student (partial skill set for varied scores) ----
        User student = new User();
        student.setEmail("student@credx.dev");
        student.setPassword(encoder.encode("password123"));
        student.setFirstName("Sam");
        student.setLastName("Student");
        student.setRole(RoleName.STUDENT);
        student.setGpa(7.6);
        student.setWorkAuthStatus("CITIZEN");
        student.setExperienceYears(1);
        student.setDesiredRole("Backend");
        student.setPreferredLocation("Remote");
        student.setOpenToRemote(true);
        student.setProfileCompleted(true);
        for (String sk : List.of("JavaScript", "TypeScript", "Node.js", "React", "SQL", "Git", "REST APIs")) {
            Skill skill = byName.get(sk);
            if (skill != null) student.getSkills().add(skill);
        }
        users.save(student);

        System.out.println("✅ Seed complete — student@credx.dev / recruiter@credx.dev (password123)");
    }
}
