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
  sleep: z.number().int().min(0).max(14).default(0),
  stress: z.number().int().min(0).max(10).default(0),
  notes: z.string().max(2000),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
})

export type DailyEntry = z.infer<typeof DailyEntrySchema>

export const DEFAULT_FORMULA_WEIGHTS = {
  start: 10,
  webcam: -6,
  mj: -2,
  alcohol: -2,
  workout: 1,
  deepWorkRate: 0.5,
  deepWorkCap: 2,
} as const

export const FormulaWeightsSchema = z.object({
  start: z.number().default(10),
  webcam: z.number().default(-6),
  mj: z.number().default(-2),
  alcohol: z.number().default(-2),
  workout: z.number().default(1),
  deepWorkRate: z.number().default(0.5),
  deepWorkCap: z.number().default(2),
})

export type FormulaWeights = z.infer<typeof FormulaWeightsSchema>

export const WeeklyGoalsSchema = z.object({
  workoutDays: z.number().int().min(0).max(7).default(4),
  deepWorkMinutes: z.number().int().min(0).max(600).default(240),
  cleanDays: z.number().int().min(0).max(7).default(7),
})

export type WeeklyGoals = z.infer<typeof WeeklyGoalsSchema>

export const SettingsSchema = z.object({
  id: z.literal('singleton').default('singleton'),
  theme: z.literal('dark').default('dark'),
  checkinHour: z.number().int().min(0).max(23).default(21),
  notesMaxLength: z.number().int().min(50).max(2000).default(280),
  autosave: z.boolean().default(false),
  formulaWeights: FormulaWeightsSchema.default(DEFAULT_FORMULA_WEIGHTS),
  weeklyGoals: WeeklyGoalsSchema.default({}),
})

export type Settings = z.infer<typeof SettingsSchema>

export const AppSessionSchema = z.object({
  id: z.literal('singleton').default('singleton'),
  activeTab: z.enum(['today', 'dashboard', 'heatmap', 'settings']).default('today'),
  activeDate: isoDateSchema,
  selectedHeatmapDate: isoDateSchema.nullable().default(null),
})

export type AppSession = z.infer<typeof AppSessionSchema>
