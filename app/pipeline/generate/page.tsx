'use client'

import { useState } from 'react'

export default function GenerateSitePage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ vercel_url?: string; message?: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('loading')
    setResult(null)
    setErrorMsg('')

    try {
      const res = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur inconnue')
        setStatus('error')
      } else {
        setResult(data)
        setStatus('success')
      }
    } catch {
      setErrorMsg('Erreur réseau')
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Générer un site démo</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Colle l&apos;URL PagesJaunes, Google Maps ou Facebook de l&apos;artisan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">URL de l&apos;artisan</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.pagesjaunes.fr/…"
            required
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition disabled:opacity-40"
        >
          {status === 'loading' ? 'Génération en cours…' : 'Générer le site'}
        </button>
      </form>

      {status === 'success' && result && (
        <div className="mt-6 rounded-xl p-5" style={{ background: '#d1fae5', border: '1px solid #a7f3d0' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#065f46' }}>Site généré avec succès</p>
          {result.vercel_url && (
            <a
              href={result.vercel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
              style={{ color: '#059669' }}
            >
              {result.vercel_url}
            </a>
          )}
          {result.message && (
            <p className="text-xs mt-1" style={{ color: '#065f46' }}>{result.message}</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-xl p-5" style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
          <p className="text-sm font-semibold" style={{ color: '#b91c1c' }}>Erreur</p>
          <p className="text-xs mt-1" style={{ color: '#b91c1c' }}>{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
