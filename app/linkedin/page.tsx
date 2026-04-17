'use client'

import { useState } from 'react'

type Post = { tone: string; label: string; content: string; hook: string }
type State = 'idle' | 'loading' | 'done' | 'error'
type Mode = 'github' | 'topic'

const TONE_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  narrative: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  technical: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e' },
  rex:       { bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
  promo:     { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7' },
}

export default function LinkedInPage() {
  const [mode, setMode] = useState<Mode>('github')
  const [url, setUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [topicContext, setTopicContext] = useState('')
  const [state, setState] = useState<State>('idle')
  const [title, setTitle] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ready = mode === 'github' ? url.trim() : topic.trim()
    if (!ready) return
    setState('loading')
    setError('')
    setPosts([])

    try {
      const body = mode === 'github'
        ? { mode: 'github', url: url.trim() }
        : { mode: 'topic', topic: topic.trim(), context: topicContext.trim() || undefined }

      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setTitle(data.repoName)
      setPosts(data.posts)
      setState('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setState('error')
    }
  }

  async function copy(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Posts LinkedIn</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Génère des posts depuis un repo GitHub ou sur n&apos;importe quel sujet
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 animate-fade-in-up stagger-1">
        {([['github', 'Depuis GitHub'], ['topic', 'Sujet libre']] as [Mode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); setState('idle'); setPosts([]) }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === m ? '#0f172a' : '#ffffff',
              color: mode === m ? '#ffffff' : '#475569',
              border: `1px solid ${mode === m ? '#0f172a' : '#e2e8f0'}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="animate-fade-in-up stagger-2 space-y-3 mb-8">
        {mode === 'github' ? (
          <div className="flex gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
            <button type="submit" disabled={state === 'loading' || !url.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: state === 'loading' ? '#e2e8f0' : '#0f172a', color: state === 'loading' ? '#94a3b8' : '#ffffff' }}>
              {state === 'loading' ? 'Génération…' : 'Générer'}
            </button>
          </div>
        ) : (
          <>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex : Pourquoi j'ai arrêté d'utiliser Redux · Mon TJM freelance · Lancer une app sans backend"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
            <textarea
              value={topicContext}
              onChange={(e) => setTopicContext(e.target.value)}
              placeholder="Contexte additionnel (optionnel) — chiffres, anecdotes, angle voulu…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
            <button type="submit" disabled={state === 'loading' || !topic.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: state === 'loading' ? '#e2e8f0' : '#0f172a', color: state === 'loading' ? '#94a3b8' : '#ffffff' }}>
              {state === 'loading' ? 'Génération…' : 'Générer 4 posts'}
            </button>
          </>
        )}
      </form>

      {/* Error */}
      {state === 'error' && (
        <div className="animate-fade-in mb-6 px-4 py-3 rounded-xl text-sm"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {state === 'loading' && (
        <div className="space-y-4">
          {Array.from({ length: mode === 'topic' ? 4 : 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', height: 180 }}>
              <div className="h-3 rounded w-24 mb-4" style={{ background: '#f1f5f9' }} />
              <div className="space-y-2">
                {[1, 0.83, 0.67].map((w, j) => (
                  <div key={j} className="h-2 rounded" style={{ background: '#f1f5f9', width: `${w * 100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {state === 'done' && (
        <div className="space-y-5">
          <p className="animate-fade-in text-sm font-medium" style={{ color: '#475569' }}>
            {posts.length} posts générés pour{' '}
            <span style={{ color: '#6366f1' }}>{title}</span>
          </p>

          {posts.map((post, i) => {
            const style = TONE_COLORS[post.tone] ?? TONE_COLORS.narrative
            const id = `post-${i}`
            return (
              <div key={id}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 4)} rounded-2xl p-6`}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: style.bg, color: style.color }}>
                      {post.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#cbd5e1' }}>{post.content.length} car.</span>
                    <button
                      onClick={() => copy(post.content, id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{
                        background: copied === id ? '#f0fdf4' : '#f8fafc',
                        color: copied === id ? '#15803d' : '#475569',
                        border: '1px solid #e2e8f0',
                      }}>
                      {copied === id ? 'Copié ✓' : 'Copier'}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#0f172a' }}>{post.hook}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#475569' }}>
                  {post.content}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
