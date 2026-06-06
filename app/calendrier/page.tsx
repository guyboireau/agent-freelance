import { createClient } from '@/lib/supabase/server'
import CalendrierView from '@/components/CalendrierView'

export default async function CalendrierPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString()

  const [{ data: rdvs }, { data: prospects }] = await Promise.all([
    supabase
      .from('rdv')
      .select('*, prospects(name, company, phone)')
      .gte('scheduled_at', startOfMonth)
      .lte('scheduled_at', endOfNextMonth)
      .order('scheduled_at'),
    supabase
      .from('prospects')
      .select('id, name, company')
      .not('status', 'in', '("postponed","lost")')
      .order('name'),
  ])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="px-6 pt-6">
        <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Calendrier RDV</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Mois en cours et suivant</p>
      </div>
      <CalendrierView
        initialRdvs={rdvs ?? []}
        prospects={prospects ?? []}
      />
    </div>
  )
}
