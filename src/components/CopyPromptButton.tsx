import { useEffect, useState } from 'react';

interface Props {
  skillName: string;
  skillSlug: string;
  skillDescription: string;
}

const GH_OWNER = 'Phooey-AI-Development';
const GH_REPO = 'AI-skills-library';
const GH_BRANCH = 'main';

async function fetchSkillMarkdown(slug: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/refs/heads/${GH_BRANCH}/skills/${slug}/SKILL.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch SKILL.md: ${res.status}`);
  return res.text();
}

// Strip YAML frontmatter from a markdown file, returning just the body.
function stripFrontmatter(md: string): string {
  // Match a frontmatter block at the very start: --- ... ---\n
  const match = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!match) return md.trim();
  return md.slice(match[0].length).trim();
}

export default function CopyPromptButton({ skillName, skillSlug, skillDescription }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleOpen() {
    setIsOpen(true);
    if (loadState === 'done') return; // already fetched
    setLoadState('loading');
    setErrorMsg('');
    try {
      const md = await fetchSkillMarkdown(skillSlug);
      setInstructions(stripFrontmatter(md));
      setLoadState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setLoadState('error');
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <>
      <button onClick={handleOpen} className="btn-secondary btn-full-width">
        📋 Copy Skill
      </button>

      {isOpen && (
        <CopySkillModal
          onClose={handleClose}
          name={skillName}
          description={skillDescription}
          instructions={instructions}
          loadState={loadState}
          errorMsg={errorMsg}
        />
      )}
    </>
  );
}

function CopySkillModal({
  onClose, name, description, instructions, loadState, errorMsg,
}: {
  onClose: () => void;
  name: string;
  description: string;
  instructions: string;
  loadState: 'idle' | 'loading' | 'done' | 'error';
  errorMsg: string;
}) {
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="copy-skill-title">
      <div className="modal">
        <header className="modal-header">
          <h2 id="copy-skill-title">Copy Skill Fields</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        </header>

        <p className="modal-intro">
          In Claude.ai, go to <strong>Settings → Capabilities → Skills → + Create skill</strong>,
          then copy each field below into the matching input.
        </p>

        <CopyField label="Skill Name" value={name} mode="input" />
        <CopyField label="Description" value={description} mode="textarea" rows={3} />

        {loadState === 'loading' && (
          <div className="copy-field">
            <label>Skill Instructions</label>
            <div className="field-loading">Loading skill content from GitHub…</div>
          </div>
        )}
        {loadState === 'error' && (
          <div className="copy-field">
            <label>Skill Instructions</label>
            <div className="field-error">Failed to load: {errorMsg}</div>
          </div>
        )}
        {loadState === 'done' && (
          <CopyField label="Skill Instructions" value={instructions} mode="textarea" rows={12} mono />
        )}
      </div>
    </div>
  );
}

function CopyField({
  label, value, mode, rows, mono,
}: {
  label: string;
  value: string;
  mode: 'input' | 'textarea';
  rows?: number;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  return (
    <div className="copy-field">
      <div className="field-header">
        <label>{label}</label>
        <button className={`copy-chip ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      {mode === 'input' ? (
        <input type="text" value={value} readOnly onFocus={(e) => e.target.select()} />
      ) : (
        <textarea
          value={value}
          readOnly
          rows={rows ?? 4}
          onFocus={(e) => e.target.select()}
          className={mono ? 'mono' : ''}
        />
      )}
    </div>
  );
}
