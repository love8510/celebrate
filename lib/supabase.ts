import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type SurveyResponse = {
  id?: string
  name: string
  q1: number
  q2: number
  q3: number
  q4: number
  submitted_at?: string
}
