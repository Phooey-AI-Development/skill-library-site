import { useEffect, useState } from 'react';
import type { Skill } from './SkillCatalog';

interface Props {
  allSkills: Skill[];
  baseUrl: string;
}

// Computes a simple relatedness score: shared category +3, each shared tag +1,
// each shared occupation +0.5. Recently-viewed skills themselves are excluded.
function score(target: Skill, source: Skill): number {
  let s = 0;
  if (target.category === source.category) s += 3;
  for (const tag of target.tags) if (source.tags.includes(tag)) s += 1;
  for (const occ of target.occupations) if (source.occupations.includes(occ)) s += 0.5;
  return s;
}

export default function RecommendedSkills({ allSkills, baseUrl }: Props) {
  const [recommendations, setRecommendations] = useState<Skill[]>([]);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    let recentSlugs: string[] = [];
    try {
      const raw = localStorage.getItem('recentlyViewed');
      if (raw) recentSlugs = JSON.parse(raw);
    } catch { /* ignore */ }

    if (recentSlugs.length === 0) {
      setHasViewed(false);
      return;
    }

    setHasViewed(true);

    // Find the recent skills in the catalog
    const recentSkills = recentSlugs
      .map((slug) => allSkills.find((s) => s.slug === slug))
      .filter((s): s is Skill => !!s);

    if (recentSkills.length === 0) return;

    // Score every other skill against each recent skill, sum the scores
    const totals = new Map<string, number>();
    for (const candidate of allSkills) {
      if (recentSlugs.includes(candidate.slug)) continue;
      if (candidate.status === 'deprecated') continue;
      let total = 0;
      for (const recent of recentSkills) {
        total += score(recent, candidate);
      }
      if (total > 0) totals.set(candidate.slug, total);
    }

    // Top 4
    const top = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([slug]) => allSkills.find((s) => s.slug === slug))
      .filter((s): s is Skill => !!s);

    setRecommendations(top);
  }, [allSkills]);

  if (!hasViewed || recommendations.length === 0) return null;

  return (
    <section className="recommendations">
      <header className="recommendations-header">
        <h2>You might also like</h2>
        <p>Based on skills you've viewed recently.</p>
      </header>
      <div className="recommendations-grid">
        {recommendations.map((s) => (
          <a key={s.slug} href={`${baseUrl}/skills/${s.slug}/`} className="rec-card">
            <span className={`category-chip cat-${slugify(s.category)}`}>{s.category}</span>
            <h3>{s.name}</h3>
            <p>{s.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
