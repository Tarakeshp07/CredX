package dev.credx.jobmatch.web;

import dev.credx.jobmatch.dto.ProfileDtos.SkillDto;
import dev.credx.jobmatch.service.SkillService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/skills")
public class SkillController {

    private final SkillService skills;

    public SkillController(SkillService skills) {
        this.skills = skills;
    }

    @GetMapping
    public List<SkillDto> list() {
        return skills.list();
    }
}
