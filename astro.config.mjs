// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nocohackers.com',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      langs: [],
      wrap: true
    }
  }
});
