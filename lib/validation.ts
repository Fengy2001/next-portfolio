import { z } from 'zod';

export const PostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  category: z.enum(['projects', 'standard']),
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  tags: z.array(z.string().max(50)).max(20),
  excerpt: z.string().max(500),
  content: z.string().max(100_000),
  image: z.string().url().optional().or(z.literal('')),
  projectTitle: z.string().max(200).optional().or(z.literal('')),
  projectDescription: z.string().max(500).optional().or(z.literal('')),
  projectImage: z.string().url().optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
});

export const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});