type ProspectFollowup = {
  status: string
  updated_at: string
}

export function needsFollowup(prospect: ProspectFollowup, now = new Date()): boolean {
  const daysSince = Math.floor(
    (now.getTime() - new Date(prospect.updated_at).getTime()) / 86400000
  )

  if (prospect.status === 'quote_sent' && daysSince >= 7) return true
  if (prospect.status === 'followup_1' && daysSince >= 10) return true
  return false
}

export function daysSinceUpdated(updatedAt: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(updatedAt).getTime()) / 86400000)
}
