package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.Job;
import dev.credx.jobmatch.domain.Skill;
import dev.credx.jobmatch.domain.User;
import dev.credx.jobmatch.dto.MatchDtos.ScoreBreakdown;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Rule-based Match Score (0..100). Deterministic and explainable — the right
 * choice for a cold-start system with no historical interaction data.
 *
 *   HARD constraints  -> gate eligibility (visa/work-auth). Fail => excluded.
 *   SOFT factors      -> weighted 0..1 signals combined into the score.
 */
@Service
public class ScoringService {

    private static final double W_SKILL = 0.60;
    private static final double W_GPA = 0.20;
    private static final double W_EXP = 0.15;
    private static final double W_REMOTE = 0.05;

    private boolean needsSponsorship(String status) {
        return "NEEDS_SPONSORSHIP".equals(status) || "STUDENT_VISA".equals(status);
    }

    private String band(int score) {
        if (score >= 80) return "Strong";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Low";
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public ScoreBreakdown score(User student, Job job) {
        Set<String> studentSkills = new HashSet<>();
        student.getSkills().forEach(s -> studentSkills.add(s.getName()));

        List<String> required = new ArrayList<>();
        for (Skill s : job.getRequiredSkills()) required.add(s.getName());

        // ---- HARD: visa / work authorization ----
        if (needsSponsorship(student.getWorkAuthStatus()) && !job.isVisaSponsorship()) {
            return new ScoreBreakdown(false,
                    "Requires visa sponsorship, which this role does not offer",
                    0, "Low",
                    Map.of("skillOverlap", 0.0, "gpa", 0.0, "experience", 0.0, "remoteFit", 0.0),
                    List.of(), required);
        }

        // ---- SOFT: skill overlap ----
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String r : required) {
            if (studentSkills.contains(r)) matched.add(r);
            else missing.add(r);
        }
        double skillOverlap = required.isEmpty() ? 0.5 : (double) matched.size() / required.size();

        // ---- SOFT: GPA threshold satisfaction ----
        double gpa;
        if (job.getMinGpa() == null) gpa = 1.0;
        else if (student.getGpa() == null) gpa = 0.5;
        else if (student.getGpa() >= job.getMinGpa()) gpa = 1.0;
        else gpa = Math.max(0.0, 1.0 - (job.getMinGpa() - student.getGpa()) / 2.0);

        // ---- SOFT: experience fit ----
        double experience;
        Integer exp = student.getExperienceYears();
        if (exp == null) experience = 0.6;
        else if (exp >= job.getMinExperience()) experience = 1.0;
        else experience = Math.max(0.0, 1.0 - (job.getMinExperience() - exp) / 3.0);

        // ---- SOFT: remote / location fit ----
        double remoteFit;
        String mode = job.getRemoteMode();
        if ("REMOTE".equals(mode)) remoteFit = student.isOpenToRemote() ? 1.0 : 0.7;
        else if ("HYBRID".equals(mode)) remoteFit = 0.85;
        else {
            String loc = student.getPreferredLocation() == null ? "" : student.getPreferredLocation().trim().toLowerCase();
            String jobLoc = job.getLocation() == null ? "" : job.getLocation().trim().toLowerCase();
            remoteFit = (!loc.isEmpty() && !jobLoc.isEmpty() && jobLoc.contains(loc)) ? 1.0 : 0.6;
        }

        double raw = W_SKILL * skillOverlap + W_GPA * gpa + W_EXP * experience + W_REMOTE * remoteFit;
        int score = (int) Math.round(raw * 100);

        Map<String, Double> factors = new LinkedHashMap<>();
        factors.put("skillOverlap", round2(skillOverlap));
        factors.put("gpa", round2(gpa));
        factors.put("experience", round2(experience));
        factors.put("remoteFit", round2(remoteFit));

        return new ScoreBreakdown(true, null, score, band(score), factors, matched, missing);
    }
}
