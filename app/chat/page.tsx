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
    <div className="flex flex-col h-screen">
      <div className="px-8 py-4 border-b border-zinc-200 bg-white">
        <h1 className="font-semibold">Chat — Agent Jarvis</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Analyse de briefs, estimation, relances</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-zinc-400 text-sm text-center py-12">
            Dis bonjour à Jarvis. Colle un brief, il s&apos;occupe du reste.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-200 px-4 py-3 rounded-xl text-sm text-zinc-400">
              Jarvis réfléchit…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-4 border-t border-zinc-200 bg-white flex gap-3">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Colle un brief ou pose une question…"
          className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-2.5 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
    </div>
  )
}
