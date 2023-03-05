import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { mermaid } from './src/plugins/mermaid';

// https://astro.build/config
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://asimbera.pages.dev',
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
    remarkPlugins: [mermaid],
  },
});
