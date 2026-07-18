import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Resolve a free-text skill string to a canonical skill id.
   * Matches (case-insensitively) against the canonical name or any synonym.
   * If nothing matches, creates a new canonical skill so the taxonomy grows.
   */
  async resolveOrCreate(raw: string): Promise<number | null> {
    const term = raw.trim();
    if (!term) return null;
    const lower = term.toLowerCase();

    const all = await this.prisma.skill.findMany();
    for (const s of all) {
      if (s.name.toLowerCase() === lower) return s.id;
      const syns = s.synonyms
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);
      if (syns.includes(lower)) return s.id;
    }

    const created = await this.prisma.skill.create({
      data: { name: term, category: 'Custom', synonyms: '' },
    });
    return created.id;
  }

  /** Resolve a list of raw skill strings to a de-duplicated list of skill ids. */
  async resolveMany(raws: string[]): Promise<number[]> {
    const ids = new Set<number>();
    for (const raw of raws) {
      const id = await this.resolveOrCreate(raw);
      if (id) ids.add(id);
    }
    return [...ids];
  }
}
