import { useState } from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
const { saveAs } = FileSaver;

interface Props {
  skillName: string;
  skillSlug: string;
}

// Fetches every file in the skill folder from the public skills repo via the
// GitHub Contents API, then packages them into a ZIP that matches Claude's
// expected upload format: <skill-name>/SKILL.md + any subfolders/resources.
const GH_OWNER = 'Phooey-AI-Development';
const GH_REPO = 'AI-skills-library';
const GH_BRANCH = 'main';

interface GhEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

async function fetchFolder(path: string): Promise<{ relPath: string; content: ArrayBuffer }[]> {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${res.statusText}`);
  const entries: GhEntry[] = await res.json();
  const files: { relPath: string; content: ArrayBuffer }[] = [];

  for (const entry of entries) {
    if (entry.type === 'file' && entry.download_url) {
      const fileRes = await fetch(entry.download_url);
      if (!fileRes.ok) throw new Error(`Failed to fetch ${entry.path}`);
      const buf = await fileRes.arrayBuffer();
      files.push({ relPath: entry.path, content: buf });
    } else if (entry.type === 'dir') {
      const subFiles = await fetchFolder(entry.path);
      files.push(...subFiles);
    }
  }
  return files;
}

export default function DownloadButton({ skillName, skillSlug }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleDownload() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const skillFolderPath = `skills/${skillSlug}`;
      const files = await fetchFolder(skillFolderPath);
      if (files.length === 0) throw new Error('No files found in skill folder');

      const zip = new JSZip();
      const skillFolder = zip.folder(skillName);
      if (!skillFolder) throw new Error('Failed to create folder in ZIP');

      for (const file of files) {
        const relPath = file.relPath.replace(`${skillFolderPath}/`, '');
        skillFolder.file(relPath, file.content);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${skillName}.zip`);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  const className = status === 'done' ? 'btn-primary btn-full-width btn-success' : 'btn-primary btn-full-width';

  return (
    <div style={{ width: '100%' }}>
      <button onClick={handleDownload} disabled={status === 'loading'} className={className}>
        {status === 'idle' && '⬇ Download skill ZIP'}
        {status === 'loading' && 'Building ZIP…'}
        {status === 'done' && '✓ Downloaded'}
        {status === 'error' && 'Try again'}
      </button>
      {status === 'error' && (
        <p style={{ fontSize: '0.72rem', color: '#b42318', margin: '0.35rem 0 0', textAlign: 'center' }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
