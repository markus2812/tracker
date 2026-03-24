import { z } from 'zod'

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const isoTimestampSchema = z.string().datetime()

export const DailyEntrySchema = z.object({
  version: z.literal(1).default(1),
  date: isoDateSchema,
  energy: z.number().int().min(1).max(10),
  mood: z.number().int().min(1).max(10),
  focus: z.number().int().min(1).max(10),
  deepWork: z.number().int().min(0).max(1440),
  workout: z.boolean(),
  webcam: z.boolean(),
  mj: z.boolean(),
  alcohol: z.boolean(),
  nicotineBefore12: z.boolean(),
  craving: z.number().int().min(0).max(10),
  notes: z.string().max(280),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
})

export const SettingsSchema = z.object({
  id: z.literal('singleton').default('singleton'),
  theme: z.literal('dark').default('dark'),
  checkinMode: z.literal('evening').default('evening'),
})
