import { useEffect, useRef, useState } from 'react';

interface PagefindResult {
  id: string;
  url: string;
  data: () => Promise<PagefindResultData>;
}

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: {
    title?: string;
    description?: string;
    category?: string;
  };
  word_count: number;
}

interface Props {
  baseUrl: string;
  // Fallback handler for dev mode (when Pagefind isn't built).
  // Receives the search query so the parent can do in-memory filtering.
  onFallbackQuery?: (query: string) => void;
}

// Pagefind is loaded dynamically because it's only available in production builds.
// In dev mode (`npm run dev`), the import fails gracefully and we use the
// existing in-memory search instead.
async function loadPagefind(baseUrl: string): Promise<any | null> {
  try {
    // Pagefind serves itself from /pagefind/pagefind.js relative to the site root.
    const url = `${baseUrl}/pagefind/pagefind.js`;
    // @vite-ignore tells Vite not to try to resolve this at build time
    const pagefind = await import(/* @vite-ignore */ url);
    await pagefind.options({ baseUrl });
    return pagefind;
  } catch {
    return null;
  }
}

export default function PagefindSearch({ baseUrl, onFallbackQuery }: Props) {
  const [pagefind, setPagefind] = useState<any | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Pagefind once on mount
  useEffect(() => {
    loadPagefind(baseUrl).then((pf) => {
      setPagefind(pf);
      setLoaded(true);
    });
  }, [baseUrl]);

  // Run search when query changes
  useEffect(() => {
    let cancelled = false;
    const q = query.trim();

    // Empty query: clear results
    if (!q) {
      setResults([]);
      setIsOpen(false);
      onFallbackQuery?.('');
      return;
    }

    // Pagefind not available (dev mode) — defer to fallback
    if (!pagefind) {
      onFallbackQuery?.(q);
      return;
    }

    // Production: use Pagefind
    setIsSearching(true);
    setIsOpen(true);
    pagefind.search(q).then(async (search: { results: PagefindResult[] }) => {
      if (cancelled) return;
      // Take top 8 results, fetch their data
      const top = search.results.slice(0, 8);
      const data = await Promise.all(top.map((r) => r.data()));
      if (cancelled) return;
      setResults(data);
      setIsSearching(false);
    }).catch(() => {
      if (cancelled) return;
      setIsSearching(false);
      setResults([]);
    });

    return () => { cancelled = true; };
  }, [query, pagefind, onFallbackQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const showFallbackHint = loaded && !pagefind && query.length > 0;

  return (
    <div className="pagefind-search" ref={containerRef}>
      <input
        type="search"
        className="search-input"
        placeholder={pagefind
          ? 'Search across all skill content (full-text)…'
          : 'Search skills by name, description, or tag…'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
      />
      {pagefind && isOpen && query && (
        <div className="pagefind-results">
          {isSearching && <div className="pagefind-status">Searching…</div>}
          {!isSearching && results.length === 0 && (
            <div className="pagefind-status">No matches in skill content.</div>
          )}
          {!isSearching && results.length > 0 && (
            <ul>
              {results.map((r, i) => (
                <li key={i}>
                  <a href={r.url} onClick={() => setIsOpen(false)}>
                    <div className="pagefind-result-title">
                      {r.meta.title ?? 'Untitled'}
                      {r.meta.category && (
                        <span className="pagefind-result-category">{r.meta.category}</span>
                      )}
                    </div>
                    <div
                      className="pagefind-result-excerpt"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {showFallbackHint && (
        <p className="pagefind-fallback-note">
          (Full-text search activates after running <code>npm run build</code>.
          Currently filtering by name &amp; description only.)
        </p>
      )}
    </div>
  );
}
