import { createClient } from '@/lib/supabase/server'
import { embedText } from './embeddings'
import type { PastProject } from '@/lib/supabase/types'

export async function findSimilarProjects(query: string, limit = 3): Promise<PastProject[]> {
  const embedding = await embedText(query)
  const supabase = await createClient()

  // Supabase expects vector as a formatted string: "[0.1,0.2,...]"
  const embeddingStr = `[${embedding.join(',')}]`

  const { data, error } = await supabase.rpc('match_past_projects', {
    query_embedding: embeddingStr,
    match_count: limit,
  })

  if (error) throw error
  return (data as unknown as PastProject[]) ?? []
}
