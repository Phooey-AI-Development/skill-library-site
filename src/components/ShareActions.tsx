import { useState } from 'react';

interface Props {
  skillName: string;
  skillSlug: string;
}

const GH_OWNER = 'Phooey-AI-Development';
const GH_REPO = 'AI-skills-library';
const GH_BRANCH = 'main';

type Status = 'idle' | 'copied' | 'error';

export default function ShareActions({ skillName, skillSlug }: Props) {
  const [linkStatus, setLinkStatus] = useState<Status>('idle');
  const [mdStatus, setMdStatus] = useState<Status>('idle');

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkStatus('copied');
      setTimeout(() => setLinkStatus('idle'), 1800);
    } catch {
      setLinkStatus('error');
      setTimeout(() => setLinkStatus('idle'), 2500);
    }
  }

  async function copyMarkdown() {
    try {
      const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/refs/heads/${GH_BRANCH}/skills/${skillSlug}/SKILL.md`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setMdStatus('copied');
      setTimeout(() => setMdStatus('idle'), 1800);
    } catch (err) {
      console.error(err);
      setMdStatus('error');
      setTimeout(() => setMdStatus('idle'), 2500);
    }
  }

  return (
    <div className="share-actions">
      <button
        className={`share-btn ${linkStatus === 'copied' ? 'copied' : ''}`}
        onClick={copyLink}
        title="Copy page link"
        aria-label="Copy page link"
      >
        {linkStatus === 'copied' ? <CheckIcon /> : <LinkIcon />}
        <span className="share-label">
          {linkStatus === 'copied' ? 'Link copied' : linkStatus === 'error' ? 'Failed' : 'Copy link'}
        </span>
      </button>
      <button
        className={`share-btn ${mdStatus === 'copied' ? 'copied' : ''}`}
        onClick={copyMarkdown}
        title="Copy raw SKILL.md"
        aria-label="Copy raw SKILL.md"
      >
        {mdStatus === 'copied' ? <CheckIcon /> : <MdIcon />}
        <span className="share-label">
          {mdStatus === 'copied' ? 'Markdown copied' : mdStatus === 'error' ? 'Failed' : 'Copy as Markdown'}
        </span>
      </button>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function MdIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
