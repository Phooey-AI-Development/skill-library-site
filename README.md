# AI Skill Library — Site

POC catalog site for browsing and downloading Claude skills hosted at
[Phooey-AI-Development/AI-skills-library](https://github.com/Phooey-AI-Development/AI-skills-library).

## Stack

- **Astro** — static site generator
- **React** — for the interactive download button
- **JSZip + FileSaver** — client-side ZIP packaging
- **GitHub Pages** — free static hosting

## Local development

```bash
git clone --recurse-submodules https://github.com/Phooey-AI-Development/skill-library-site.git
cd skill-library-site
npm install
npm run dev
```

If you forgot `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

Open <http://localhost:4321/skill-library-site/> in your browser.

## Updating skills

Skills live in the **separate** [AI-skills-library](https://github.com/Phooey-AI-Development/AI-skills-library)
repo. To update:

1. Push changes to the skills repo.
2. The site will auto-rebuild within 24 hours (daily cron) or push any change to
   this repo to trigger an immediate rebuild.
3. To pull skill updates locally: `cd skills-content && git pull origin main`.

## Deployment

Pushes to `main` deploy automatically via GitHub Actions to GitHub Pages.

**One-time setup in repo settings:**

1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. The first push to main will deploy the site

## Configuration

Edit `astro.config.mjs` and update `site` + `base` if you rename the repo.

Edit `src/components/DownloadButton.tsx` and update `GH_OWNER` / `GH_REPO` if
the skills repo moves.

## How users install skills

Each skill detail page has two paths:

1. **Download skill ZIP** — produces a Claude.ai-ready ZIP, user uploads it
   themselves via Settings → Capabilities → Skills.
2. **Request org-wide provisioning** — opens a pre-filled email to the Claude
   Enterprise Owner, who can deploy the skill to all users at once.

## Roadmap (not in POC)

- Pagefind for client-side search
- Tag/category filtering from frontmatter
- Approval-status badges (`status: approved | pending | deprecated`)
- Move to private repo + Entra ID auth via Azure Static Web Apps
