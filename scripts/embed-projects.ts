/**
 * Run once to generate embeddings for all past_projects.
 * Usage: npx tsx scripts/embed-projects.ts
 */
import { createClient } from '@supabase/supabase-js'
import { openai } from '@ai-sdk/openai'
import { embedMany } from 'ai'
import type { Database } from '../lib/supabase/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: projects, error } = await supabase
    .from('past_projects')
    .select('*')
    .is('embedding', null)

  if (error) throw error
  if (!projects?.length) { console.log('Tous les projets ont déjà un embedding.'); return }

  console.log(`Génération des embeddings pour ${projects.length} projet(s)…`)

  const texts = projects.map(
    (p) => `Projet : ${p.name}\nClient : ${p.client}\nType : ${p.type}\nDescription : ${p.description}\nStack : ${p.stack.join(', ')}`
  )

  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: texts,
  })

  for (let i = 0; i < projects.length; i++) {
    const embeddingStr = `[${embeddings[i].join(',')}]`
    const { error: updateError } = await supabase
      .from('past_projects')
      .update({ embedding: embeddingStr })
      .eq('id', projects[i].id)

    if (updateError) {
      console.error(`Erreur pour ${projects[i].name}:`, updateError)
    } else {
      console.log(`✓ ${projects[i].name}`)
    }
  }

  console.log('Terminé.')
}

main().catch(console.error)
