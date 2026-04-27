'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type InitMessage = { id: string; role: 'user' | 'assistant'; content: string }

const THREAD_KEY = 'jarvis_thread_id'

function genThreadId() {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const SUGGESTIONS = [
  'Analyse ce brief : …',
  'Montre-moi mes prospects actifs',
  'Rédige une relance pour [nom]',
  'Estime une app mobile React Native avec auth et paiements',
]

function normalizeMessageContent(content: unknown): string {
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text
          return typeof text === 'string' ? text : ''
        }
        return JSON.stringify(part)
      })
      .join('\n')
  }

  return JSON.stringify(content, null, 2)
}

function MarkdownMessage({ content }: { content: unknown }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
      {normalizeMessageContent(content)}
    </ReactMarkdown>
  )
}

function ChatUI({ threadId, initialMessages }: { threadId: string; initialMessages: InitMessage[] }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/agent/chat',
    initialMessages,
    body: { thread_id: threadId },
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <div className="px-8 py-4 flex items-center justify-between"
        style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: '#6366f1', color: '#ffffff' }}>J</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Jarvis</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {isLoading ? 'En train de réfléchir…' : messages.length > 0 ? `${messages.length} messages` : 'Prêt'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const newId = genThreadId()
            localStorage.setItem(THREAD_KEY, newId)
            window.location.reload()
          }}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          title="Nouvelle conversation">
          + Nouvelle conv.
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="animate-fade-in-up flex flex-col items-center justify-center h-full gap-4 pb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: '#eef2ff' }}>◎</div>
            <p className="text-sm font-medium" style={{ color: '#475569' }}>Jarvis est prêt</p>
            <p className="text-xs text-center max-w-xs" style={{ color: '#94a3b8' }}>
              Je connais tes projets actifs et ton historique. Pose une question ou colle un brief.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s}
                  onClick={() => setInput(s)}
                  className="text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={m.id}
            className={`animate-fade-in-up flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${i * 0.05}s` }}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0"
                style={{ background: '#6366f1', color: '#fff' }}>J</div>
            )}
            <div className="max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={m.role === 'user'
                ? { background: '#0f172a', color: '#f8fafc', borderBottomRightRadius: 4 }
                : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
              <MarkdownMessage content={m.content} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-2 shrink-0"
              style={{ background: '#6366f1', color: '#fff' }}>J</div>
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
              <span className="inline-flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#94a3b8', animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}
        className="px-8 py-4 flex gap-3"
        style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Colle un brief, pose une question, demande une relance…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
        <button type="submit" disabled={isLoading || !input.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: '#0f172a', color: '#ffffff' }}>
          Envoyer
        </button>
      </form>
    </div>
  )
}

export default function ChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [initMessages, setInitMessages] = useState<InitMessage[] | null>(null)

  useEffect(() => {
    let tid = localStorage.getItem(THREAD_KEY)
    if (!tid) {
      tid = genThreadId()
      localStorage.setItem(THREAD_KEY, tid)
    }
    setThreadId(tid)

    fetch(`/api/agent/messages?thread_id=${encodeURIComponent(tid)}`)
      .then((r) => r.json())
      .then((d) => setInitMessages(d.messages ?? []))
      .catch(() => setInitMessages([]))
  }, [])

  if (!threadId || initMessages === null) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#f8fafc' }}>
        <div className="flex gap-1">
          {[0, 150, 300].map((d) => (
            <span key={d} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: '#6366f1', animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  return <ChatUI threadId={threadId} initialMessages={initMessages} />
}
