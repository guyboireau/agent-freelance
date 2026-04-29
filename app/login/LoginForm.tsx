'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8fafc' }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Connexion</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Accès sécurisé à Agent Freelance</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: '#64748b' }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid #e2e8f0' }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: '#64748b' }}>Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid #e2e8f0' }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#0f172a', color: '#ffffff', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
