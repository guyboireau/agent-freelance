'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect } from 'react'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agent/chat',
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <div className="px-8 py-4 flex items-center gap-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ background: '#6366f1', color: '#ffffff' }}>J</div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Jarvis</p>
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            {isLoading ? 'En train de réfléchir…' : 'Prêt'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="animate-fade-in-up flex flex-col items-center justify-center h-full gap-4 pb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: '#eef2ff' }}>◎</div>
            <p className="text-sm font-medium" style={{ color: '#475569' }}>Jarvis est prêt</p>
            <p className="text-xs text-center max-w-xs" style={{ color: '#94a3b8' }}>
              Colle un brief client, je l&apos;analyse et génère une estimation. Je peux aussi créer des prospects et rédiger des relances.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
              {['Analyse ce brief : ...', 'Montre-moi mes prospects actifs', 'Rédige une relance pour X'].map((s) => (
                <button key={s} onClick={() => handleInputChange({ target: { value: s } } as React.ChangeEvent<HTMLInputElement>)}
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
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0"
                style={{ background: '#6366f1', color: '#fff' }}>J</div>
            )}
            <div className="max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: '#0f172a', color: '#f8fafc', borderBottomRightRadius: 4 }
                : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 shrink-0"
              style={{ background: '#6366f1', color: '#fff' }}>J</div>
            <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '300ms' }} />
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
          placeholder="Colle un brief ou pose une question…"
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
