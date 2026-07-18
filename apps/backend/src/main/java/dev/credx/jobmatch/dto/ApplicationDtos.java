package dev.credx.jobmatch.dto;

import java.time.Instant;

public class ApplicationDtos {

    public record JobBrief(Long id, String title, String company, String location, String remoteMode) {}

    public record ApplicationDto(Long id, String status, Instant appliedAt, JobBrief job) {}
}
