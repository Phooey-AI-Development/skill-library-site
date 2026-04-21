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

export default function SkillCatalog({ skills, baseUrl }: Props) {
  const [query, setQuery] = useState('');
  const [occupation, setOccupation] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [showDeprecated, setShowDeprecated] = useState(false);

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q') ?? '');
    if (params.get('occupation')) setOccupation(params.get('occupation') ?? '');
    if (params.get('category')) setCategory(params.get('category') ?? '');
    if (params.get('tag')) setTag(params.get('tag') ?? '');
    if (params.get('deprecated') === '1') setShowDeprecated(true);
  }, []);

  // Sync filters back to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (occupation) params.set('occupation', occupation);
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (showDeprecated) params.set('deprecated', '1');
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, '', url);
  }, [query, occupation, category, tag, showDeprecated]);

  const occupationCounts = useMemo(() => countBy(skills.flatMap((s) => s.occupations)), [skills]);
  const categoryCounts = useMemo(() => countBy(skills.map((s) => s.category)), [skills]);
  const tagCounts = useMemo(() => countBy(skills.flatMap((s) => s.tags)), [skills]);
  const deprecatedCount = useMemo(() => skills.filter((s) => s.status === 'deprecated').length, [skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
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
  }, [skills, query, occupation, category, tag, showDeprecated]);

  const hasActiveFilter = !!(query || occupation || category || tag);

  return (
    <div>
      <RecommendedSkills allSkills={skills} baseUrl={baseUrl} />

      <div className="filters">
        <PagefindSearch baseUrl={baseUrl} onFallbackQuery={setQuery} />
        <div className="dropdown-row">
          <FilterSelect label="Occupation" value={occupation} onChange={setOccupation} options={occupationCounts} />
          <FilterSelect label="Category" value={category} onChange={setCategory} options={categoryCounts} />
          <FilterSelect label="Tag" value={tag} onChange={setTag} options={tagCounts} />
          {hasActiveFilter && (
            <button
              className="clear-btn"
              onClick={() => { setQuery(''); setOccupation(''); setCategory(''); setTag(''); }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="filters-footer">
          <p className="result-count">
            Showing <strong>{filtered.length}</strong> of {skills.length} skills
          </p>
          {deprecatedCount > 0 && (
            <label className="deprecated-toggle">
              <input
                type="checkbox"
                checked={showDeprecated}
                onChange={(e) => setShowDeprecated(e.target.checked)}
              />
              <span>Include deprecated ({deprecatedCount})</span>
            </label>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>No skills match your filters.</p>
          <button className="clear-btn" onClick={() => { setQuery(''); setOccupation(''); setCategory(''); setTag(''); }}>
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
                  {s.status === 'draft' && <span className="badge badge-draft" title="Pending review — use with caution">Draft</span>}
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
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Map<string, number>;
}) {
  const sorted = [...options.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return (
    <select
      className="filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Filter by ${label}`}
    >
      <option value="">All {label.toLowerCase()}s</option>
      {sorted.map(([name, count]) => (
        <option key={name} value={name}>{name} ({count})</option>
      ))}
    </select>
  );
}

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
