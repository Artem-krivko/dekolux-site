// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: "https://dekolux.by",

  output: "server",
  adapter: vercel({}),

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()]
  }
});