import { z } from "zod";

export const ResumeSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),

  education: z.array(
    z.object({
      school: z.string().default(""),
      degree: z.string().default(""),
      location: z.string().default(""),
      graduation_date: z.string().default(""),
      gpa: z.string().default(""),
      coursework: z.array(z.string()).default([]),
    })
  ).default([]),

  experience: z.array(
    z.object({
      company: z.string().default(""),
      role: z.string().default(""),
      location: z.string().default(""),
      start_date: z.string().default(""),
      end_date: z.string().default(""),
      bullets: z.array(z.string()).default([]),
    })
  ).default([]),

  projects: z.array(
    z.object({
      name: z.string().default(""),
      tech_stack: z.array(z.string()).default([]),
      bullets: z.array(z.string()).default([]),
    })
  ).default([]),

  skills: z.object({
    languages: z.array(z.string()).default([]),
    cloud: z.array(z.string()).default([]),
    ml_ai: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
  }).default({
    languages: [],
    cloud: [],
    ml_ai: [],
    tools: [],
  }),

  awards: z.array(z.string()).default([]),

  raw_summary: z.string().default(""),
});