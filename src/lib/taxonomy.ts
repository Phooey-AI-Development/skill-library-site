// Auto-categorization rules for skills.
// Each skill gets: occupation[], category, tags[].
// Frontmatter values ALWAYS win over inferred values — this is a fallback.
//
// Matching is case-insensitive against the skill's name + description + folder.
// First matching pattern in each section wins for single-value fields (category).
// All matching patterns apply for multi-value fields (occupations, tags).

export interface Taxonomy {
  occupations: string[];
  category: string;
  tags: string[];
}

const RULES = {
  category: [
    { name: 'Code & Development', patterns: [/\b(golang|go\s)|python|javascript|typescript|react|node|api|sdk|library|framework|debugging|testing|lint|ci\/cd|database|sql|grpc|backend|frontend|devops|kubernetes|docker|git\b|code\s|coding|programming|repository|repo\s/i] },
    { name: 'Document Creation', patterns: [/\b(pdf|powerpoint|pptx|word\s|docx|excel|xlsx|spreadsheet|presentation|document creation|report\b|memo|letter|template)/i] },
    { name: 'Communication', patterns: [/\b(email|slack|teams|message|meeting notes|writing|voice|tone|humaniz|draft|reply|response)/i] },
    { name: 'Data Analysis', patterns: [/\b(data analysis|analytics|chart|visualization|dataset|statistics|metric|dashboard|insight)/i] },
    { name: 'Research', patterns: [/\b(research|investigate|literature|summari[sz]e|web search|find|discover)/i] },
    { name: 'Workflow Automation', patterns: [/\b(automation|workflow|pipeline|integration|connect|orchestrat|trigger|schedule)/i] },
    { name: 'Design', patterns: [/\b(design|ui|ux|figma|wireframe|mockup|brand|logo|color palette)/i] },
    { name: 'Productivity', patterns: [/\b(plan|task|todo|note|calendar|productivity|organize)/i] },
  ],
  occupations: [
    { name: 'Engineering', patterns: [/\b(golang|go\s|python|javascript|typescript|react|node|api|sdk|backend|frontend|devops|kubernetes|docker|database|sql|grpc|engineer|developer|coding|programming|repository)/i] },
    { name: 'Data & Analytics', patterns: [/\b(data\s|analytics|sql|chart|dashboard|statistics|dataset|metric|insight|business intelligence|bi\b)/i] },
    { name: 'Underwriting', patterns: [/\b(underwrit|risk assess|policy creation|coverage|premium calc)/i] },
    { name: 'Claims', patterns: [/\b(claim|adjuster|loss|incident|fnol)/i] },
    { name: 'Sales & Brokerage', patterns: [/\b(sales|broker|prospect|pipeline|crm|customer outreach|deal)/i] },
    { name: 'Marketing & Communications', patterns: [/\b(marketing|campaign|content|social media|brand|copy\s|writing|blog|newsletter)/i] },
    { name: 'HR & People Ops', patterns: [/\b(recruit|hire|onboard|employee|hr\b|people ops|talent|interview)/i] },
    { name: 'Finance & Accounting', patterns: [/\b(finance|accounting|budget|forecast|invoice|expense|p&l|gl\b|reconcil)/i] },
    { name: 'Legal & Compliance', patterns: [/\b(legal|compliance|contract|regulation|gdpr|nydfs|audit|policy review)/i] },
    { name: 'Operations', patterns: [/\b(operations|process|workflow|sop\b|runbook|incident management)/i] },
    { name: 'Executive', patterns: [/\b(executive|strategy|board|leadership|c-suite|okr)/i] },
  ],
  tags: [
    { name: 'golang', patterns: [/\b(golang|\bgo\s)/i] },
    { name: 'python', patterns: [/\bpython\b/i] },
    { name: 'javascript', patterns: [/\b(javascript|typescript|node\.?js)\b/i] },
    { name: 'react', patterns: [/\breact\b/i] },
    { name: 'sql', patterns: [/\b(sql|database|postgres|mysql|mariadb|sqlite)\b/i] },
    { name: 'pdf', patterns: [/\bpdf\b/i] },
    { name: 'excel', patterns: [/\b(excel|xlsx|spreadsheet)\b/i] },
    { name: 'powerpoint', patterns: [/\b(powerpoint|pptx|presentation|slides?\b)/i] },
    { name: 'word', patterns: [/\b(word\s|docx)\b/i] },
    { name: 'testing', patterns: [/\btest(ing)?\b/i] },
    { name: 'security', patterns: [/\b(security|vulnerab|injection)\b/i] },
    { name: 'performance', patterns: [/\bperformance\b/i] },
    { name: 'documentation', patterns: [/\b(documentation|docs\b)/i] },
    { name: 'design-patterns', patterns: [/\bdesign[-\s]pattern/i] },
    { name: 'best-practices', patterns: [/\bbest practice/i] },
    { name: 'observability', patterns: [/\b(observability|logging|metrics|tracing|monitoring)\b/i] },
    { name: 'concurrency', patterns: [/\b(concurrency|concurrent|parallel|goroutine)\b/i] },
    { name: 'cli', patterns: [/\bcli\b/i] },
    { name: 'writing', patterns: [/\b(writing|humaniz|tone|voice)\b/i] },
    { name: 'meeting', patterns: [/\bmeeting\b/i] },
  ],
};

export function inferTaxonomy(searchText: string, frontmatter: any): Taxonomy {
  const text = searchText.toLowerCase();
  const fmCategory = frontmatter.category as string | undefined;
  const fmOccupations = normalizeArray(frontmatter.occupation ?? frontmatter.occupations);
  const fmTags = normalizeArray(frontmatter.tags);

  let category = fmCategory ?? 'Uncategorized';
  if (!fmCategory) {
    for (const rule of RULES.category) {
      if (rule.patterns.some((p) => p.test(text))) { category = rule.name; break; }
    }
  }

  const occupations = new Set(fmOccupations);
  for (const rule of RULES.occupations) {
    if (rule.patterns.some((p) => p.test(text))) occupations.add(rule.name);
  }
  if (occupations.size === 0) occupations.add('General');

  const tags = new Set(fmTags);
  for (const rule of RULES.tags) {
    if (rule.patterns.some((p) => p.test(text))) tags.add(rule.name);
  }

  return { occupations: [...occupations].sort(), category, tags: [...tags].sort() };
}

function normalizeArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(/[,\s]+/).filter(Boolean);
  return [];
}
