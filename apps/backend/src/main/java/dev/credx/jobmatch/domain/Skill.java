package dev.credx.jobmatch.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "skills")
@Getter
@Setter
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String category = "";

    /** Comma-separated, lowercased synonyms used by the normalizer. */
    @Column(nullable = false, length = 1000)
    private String synonyms = "";
}
