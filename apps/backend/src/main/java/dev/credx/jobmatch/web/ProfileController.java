package dev.credx.jobmatch.web;

import dev.credx.jobmatch.dto.ProfileDtos.ProfileDto;
import dev.credx.jobmatch.dto.ProfileDtos.UpdateProfileRequest;
import dev.credx.jobmatch.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profiles;

    public ProfileController(ProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping
    public ProfileDto get(@AuthenticationPrincipal Long userId) {
        return profiles.get(userId);
    }

    @PutMapping
    public ProfileDto update(@AuthenticationPrincipal Long userId, @Valid @RequestBody UpdateProfileRequest req) {
        return profiles.update(userId, req);
    }
}
