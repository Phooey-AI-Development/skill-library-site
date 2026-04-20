// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// IMPORTANT: update `site` and `base` to match your GitHub Pages URL.
// For a project page at https://phooey-ai-development.github.io/skill-library-site/
//   site: 'https://phooey-ai-development.github.io'
//   base: '/skill-library-site'
// For a user/org page (repo named <org>.github.io) drop `base`.

export default defineConfig({
  site: 'https://phooey-ai-development.github.io',
  base: '/skill-library-site',
  integrations: [react()],
  output: 'static',
});
