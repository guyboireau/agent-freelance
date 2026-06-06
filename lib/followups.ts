export function needsFollowup(prospect: { status: string; updated_at: string; last_contact_at: string | null }, now = new Date()): boolean {
  const ref = prospect.last_contact_at ?? prospect.updated_at
  const daysSince = Math.floor((now.getTime() - new Date(ref).getTime()) / 86400000)
  if (prospect.status === 'demo_generated' && daysSince >= 7) return true
  if (prospect.status === 'followup_r2' && daysSince >= 5) return true
  return false
}

export function daysSinceUpdated(updatedAt: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(updatedAt).getTime()) / 86400000)
}
