package dev.credx.jobmatch.service;

import dev.credx.jobmatch.domain.Skill;
import dev.credx.jobmatch.dto.ProfileDtos.SkillDto;
import dev.credx.jobmatch.repo.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class SkillService {

    private final SkillRepository skills;

    public SkillService(SkillRepository skills) {
        this.skills = skills;
    }

    @Transactional(readOnly = true)
    public List<SkillDto> list() {
        return skills.findAll().stream()
                .sorted(Comparator.comparing(Skill::getName))
                .map(Mappers::skill)
                .toList();
    }

    /**
     * Resolve a free-text skill to a canonical Skill, matching name or synonym
     * (case-insensitive). Creates a new canonical skill if nothing matches.
     */
    @Transactional
    public Skill resolveOrCreate(String raw) {
        String term = raw == null ? "" : raw.trim();
        if (term.isEmpty()) return null;
        String lower = term.toLowerCase();

        for (Skill s : skills.findAll()) {
            if (s.getName().equalsIgnoreCase(term)) return s;
            for (String syn : s.getSynonyms().split(",")) {
                if (syn.trim().toLowerCase().equals(lower) && !syn.isBlank()) return s;
            }
        }
        Skill created = new Skill();
        created.setName(term);
        created.setCategory("Custom");
        created.setSynonyms("");
        return skills.save(created);
    }

    @Transactional
    public Set<Skill> resolveMany(List<String> raws) {
        Set<Skill> result = new LinkedHashSet<>();
        if (raws == null) return result;
        for (String raw : raws) {
            Skill s = resolveOrCreate(raw);
            if (s != null) result.add(s);
        }
        return result;
    }
}
