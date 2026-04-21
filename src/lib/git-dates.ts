// Returns the date a skill folder was added to git.
// Used to drive the "New" badge on recently-added skills.
//
// Reads via `git log --diff-filter=A` for the folder. Cached per build.
import { execSync } from 'node:child_process';
import path from 'node:path';

const cache = new Map<string, Date | null>();

export function getSkillAddedDate(slug: string): Date | null {
  if (cache.has(slug)) return cache.get(slug)!;

  const repoRoot = path.resolve(process.cwd(), 'skills-content');
  const folderPath = `skills/${slug}`;

  try {
    // --diff-filter=A → only commits where the path was Added
    // --reverse + head -1 → first add (oldest)
    // %cI → committer ISO date
    const out = execSync(
      `git log --diff-filter=A --reverse --format=%cI -- "${folderPath}"`,
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim().split('\n')[0];

    if (!out) {
      cache.set(slug, null);
      return null;
    }
    const date = new Date(out);
    if (isNaN(date.getTime())) {
      cache.set(slug, null);
      return null;
    }
    cache.set(slug, date);
    return date;
  } catch {
    // Submodule might not have full history (shallow clone in CI)
    // — that's fine, just return null so no "New" badge appears.
    cache.set(slug, null);
    return null;
  }
}

export function isRecent(date: Date | null, daysThreshold = 14): boolean {
  if (!date) return false;
  const ms = Date.now() - date.getTime();
  return ms < daysThreshold * 24 * 60 * 60 * 1000;
}
