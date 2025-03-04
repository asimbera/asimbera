// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import expressiveCode from 'astro-expressive-code';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://asimbera.pages.dev',
  integrations: [
    sitemap(),
    expressiveCode({
      themes: ['monokai'],
      styleOverrides: {
        codeFontFamily: '"Iosevka", monospace',
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
