// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://phooey-ai-development.github.io',
  base: '/skill-library-site',
  integrations: [react()],
  output: 'static',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      // defaultColor: false tells Shiki NOT to pick a "default" theme that
      // gets rendered as a plain `color:` style. Instead, each token gets
      // both --shiki-light and --shiki-dark as CSS variables, and we pick
      // which one is active via the data-theme attribute.
      defaultColor: false,
      wrap: false,
    },
  },
});
