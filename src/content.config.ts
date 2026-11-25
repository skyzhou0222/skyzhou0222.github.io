import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(), subtitle: z.string(), summary: z.string(), cardLead: z.string(),
    role: z.string(), period: z.string(), stage: z.string(),
    tags: z.array(z.string()), order: z.number(), cover: z.string(), problem: z.string(),
    updated: z.string(),
  }),
});
export const collections = { projects };
