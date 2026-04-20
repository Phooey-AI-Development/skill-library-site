import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Reads every SKILL.md from the skills submodule.
// Each skill lives at: skills-content/skills/<skill-name>/SKILL.md
// `base` is resolved relative to the project root (where astro.config.mjs lives).
//
// Schema is intentionally permissive: skills come from many sources and use
// inconsistent frontmatter shapes. We only require `name` and `description`,
// and accept anything for everything else (string, array, object, whatever).
const skills = defineCollection({
  loader: glob({
    pattern: 'skills/*/SKILL.md',
    base: './skills-content',
  }),
  schema: z
    .object({
      name: z.string(),
      description: z.string(),
      license: z.string().optional(),
      compatibility: z.union([z.string(), z.array(z.string())]).optional(),
      version: z.union([z.string(), z.number()]).optional(),
      // allowed-tools shows up as either a space-separated string OR a YAML list
      'allowed-tools': z.union([z.string(), z.array(z.string())]).optional(),
      'user-invocable': z.boolean().optional(),
      metadata: z
        .object({
          author: z.string().optional(),
          version: z.union([z.string(), z.number()]).optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export const collections = { skills };
