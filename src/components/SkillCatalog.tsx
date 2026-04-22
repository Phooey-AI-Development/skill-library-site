import { useEffect, useMemo, useState } from 'react';
import PagefindSearch from './PagefindSearch';
import RecommendedSkills from './RecommendedSkills';

export interface Skill {
  slug: string;
  name: string;
  description: string;
  author?: string;
  version?: string;
  license?: string;
  category: string;
  occupations: string[];
  tags: string[];
  status: 'draft' | 'approved' | 'deprecated';
  addedDate: string | null;
  isNew: boolean;
}

interface Props {
  skills: Skill[];
  baseUrl: string;
}

type SortKey = 'alphabetical' | 'newest' | 'category';

export default function SkillCatalog({ skills, baseUrl }: Props) {
  const [query, setQuery] = useState('');
  const [occupation, setOccupation] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('alphabetical');

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q') ?? '');
    if (params.get('occupation')) setOccupation(params.get('occupation') ?? '');
    if (params.get('category')) setCategory(params.get('category') ?? '');
    if (params.get('tag')) setTag(params.get('tag') ?? '');
    if (params.get('deprecated') === '1') setShowDeprecated(true);
    const sort = params.get('sort');
    if (sort === 'newest' || sort === 'category') setSortKey(sort);
  }, []);

  // Sync filters back to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (occupation) params.set('occupation', occupation);
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (showDeprecated) params.set('deprecated', '1');
    if (sortKey !== 'alphabetical') params.set('sort', sortKey);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, '', url);
  }, [query, occupation, category, tag, showDeprecated, sortKey]);

  // Scroll to the "All Skills" section when a browse filter is clicked
  function scrollToAllSkills() {
    const el = document.getElementById('all-skills');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const occupationCounts = useMemo(() => countBy(skills.flatMap((s) => s.occupations)), [skills]);
  const categoryCounts = useMemo(() => countBy(skills.map((s) => s.category)), [skills]);
  const tagCounts = useMemo(() => countBy(skills.flatMap((s) => s.tags)), [skills]);
  const deprecatedCount = useMemo(() => skills.filter((s) => s.status === 'deprecated').length, [skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = skills.filter((s) => {
      if (s.status === 'deprecated' && !showDeprecated) return false;
      if (occupation && !s.occupations.includes(occupation)) return false;
      if (category && s.category !== category) return false;
      if (tag && !s.tags.includes(tag)) return false;
      if (q) {
        const hay = `${s.name} ${s.description} ${s.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Apply sort
    switch (sortKey) {
      case 'newest':
        return list.slice().sort((a, b) => {
          const ad = a.addedDate ? new Date(a.addedDate).getTime() : 0;
          const bd = b.addedDate ? new Date(b.addedDate).getTime() : 0;
          return bd - ad;
        });
      case 'category':
        return list.slice().sort((a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        );
      default:
        return list;
    }
  }, [skills, query, occupation, category, tag, showDeprecated, sortKey]);

  const hasActiveFilter = !!(query || occupation || category || tag);

  // Click handlers: toggle filters on/off (click same pill → clear)
  function toggleCategory(cat: string) {
    setCategory((prev) => (prev === cat ? '' : cat));
    scrollToAllSkills();
  }
  function toggleOccupation(occ: string) {
    setOccupation((prev) => (prev === occ ? '' : occ));
    scrollToAllSkills();
  }
  function toggleTag(t: string) {
    setTag((prev) => (prev === t ? '' : t));
    scrollToAllSkills();
  }

  return (
    <div>
      <RecommendedSkills allSkills={skills} baseUrl={baseUrl} />

      {/* Search bar */}
      <div className="browse-search">
        <PagefindSearch baseUrl={baseUrl} onFallbackQuery={setQuery} />
      </div>

      {/* Browse by Category */}
      <section className="browse-section">
        <header className="browse-section-header">
          <h2>&gt; Browse by category</h2>
          <span className="browse-count">{categoryCounts.size} categories</span>
        </header>
        <div className="browse-pills">
          {[...categoryCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => {
              const isActive = category === name;
              return (
                <button
                  key={name}
                  className={`browse-pill category-chip cat-${slugify(name)} ${isActive ? 'is-active' : ''}`}
                  onClick={() => toggleCategory(name)}
                  aria-pressed={isActive}
                >
                  {name} · {count}
                </button>
              );
            })}
        </div>
      </section>

      {/* Browse by Occupation */}
      <section className="browse-section">
        <header className="browse-section-header">
          <h2>&gt; Browse by occupation</h2>
          <span className="browse-count">{occupationCounts.size} occupations</span>
        </header>
        <div className="browse-tiles">
          {[...occupationCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => {
              const isActive = occupation === name;
              return (
                <button
                  key={name}
                  className={`browse-tile ${isActive ? 'is-active' : ''}`}
                  onClick={() => toggleOccupation(name)}
                  aria-pressed={isActive}
                >
                  <div className="browse-tile-label">{name}</div>
                  <div className="browse-tile-count">
                    {count}<span className="browse-tile-unit">skill{count === 1 ? '' : 's'}</span>
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      {/* All Skills */}
      <section className="browse-section" id="all-skills">
        <header className="browse-section-header">
          <h2>&gt; All skills</h2>
          <div className="all-skills-controls">
            {hasActiveFilter && (
              <button className="clear-btn" onClick={() => {
                setQuery(''); setOccupation(''); setCategory(''); setTag('');
              }}>
                Clear filters
              </button>
            )}
            <select
              className="filter-select sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort skills"
            >
              <option value="alphabetical">Sort: Alphabetical</option>
              <option value="newest">Sort: Newest first</option>
              <option value="category">Sort: By category</option>
            </select>
            <span className="browse-count">
              {filtered.length} of {skills.length} skills
            </span>
          </div>
        </header>

        {/* Active-filter summary row */}
        {hasActiveFilter && (
          <div className="active-filters">
            <span className="active-filters-label">Active filters:</span>
            {category && (
              <button className="active-filter-pill" onClick={() => setCategory('')}>
                Category: {category} <span className="pill-x">×</span>
              </button>
            )}
            {occupation && (
              <button className="active-filter-pill" onClick={() => setOccupation('')}>
                Occupation: {occupation} <span className="pill-x">×</span>
              </button>
            )}
            {tag && (
              <button className="active-filter-pill" onClick={() => setTag('')}>
                Tag: {tag} <span className="pill-x">×</span>
              </button>
            )}
            {query && (
              <button className="active-filter-pill" onClick={() => setQuery('')}>
                Search: "{query}" <span className="pill-x">×</span>
              </button>
            )}
          </div>
        )}

        {deprecatedCount > 0 && (
          <label className="deprecated-toggle all-skills-deprecated">
            <input
              type="checkbox"
              checked={showDeprecated}
              onChange={(e) => setShowDeprecated(e.target.checked)}
            />
            <span>Include deprecated ({deprecatedCount})</span>
          </label>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <p>No skills match your filters.</p>
            <button className="clear-btn" onClick={() => {
              setQuery(''); setOccupation(''); setCategory(''); setTag('');
            }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((s) => (
              <a
                key={s.slug}
                href={`${baseUrl}/skills/${s.slug}/`}
                className={`card ${s.status === 'deprecated' ? 'card-deprecated' : ''}`}
                onClick={() => recordRecentlyViewed(s.slug)}
              >
                <div className="card-header">
                  <span className={`category-chip cat-${slugify(s.category)}`}>{s.category}</span>
                  <div className="card-badges">
                    {s.isNew && <span className="badge badge-new">NEW</span>}
                    {s.status === 'approved' && <span className="badge badge-approved" title="Approved for production use">✓ Approved</span>}
                    {s.status === 'draft' && <span className="badge badge-draft" title="Pending review">Draft</span>}
                    {s.status === 'deprecated' && <span className="badge badge-deprecated">Deprecated</span>}
                  </div>
                </div>
                <h2>{s.name}</h2>
                <p>{s.description}</p>
                <div className="card-footer">
                  {s.author && <span className="author">{s.author}</span>}
                  {s.version && <span className="version">v{s.version}</span>}
                  {s.tags.slice(0, 3).map((t) => (
                    <span key={t} className="tag">#{t}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function countBy(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const item of items) m.set(item, (m.get(item) ?? 0) + 1);
  return m;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Tracks recently viewed skill slugs in localStorage so the recommendations
// component can suggest related skills next time. Capped at 12 entries.
function recordRecentlyViewed(slug: string) {
  try {
    const raw = localStorage.getItem('recentlyViewed');
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 12);
    localStorage.setItem('recentlyViewed', JSON.stringify(next));
  } catch { /* ignore */ }
}
