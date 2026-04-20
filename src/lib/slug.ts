// Extract the skill folder name (slug) from an Astro content entry id.
// The glob loader produces ids like "skills/golang-cli/SKILL" — we want "golang-cli".
export function slugFromEntryId(id: string): string {
  // Strip filename if present (e.g. "/SKILL"), then take the last path segment.
  const parts = id.split('/').filter(Boolean);
  // Remove trailing "SKILL" or "SKILL.md" if it's there
  if (parts.length > 0 && /^SKILL(\.md)?$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts[parts.length - 1] ?? id;
}
