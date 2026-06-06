import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .not('status', 'in', '("postponed")')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-6 overflow-x-auto min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Pipeline commercial</h1>
        <span className="text-sm" style={{ color: '#94a3b8' }}>{(prospects ?? []).length} prospects actifs</span>
      </div>
      <KanbanBoard initialProspects={prospects ?? []} />
    </div>
  )
}
