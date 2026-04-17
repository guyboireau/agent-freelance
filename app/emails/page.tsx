'use client'

import { useState } from 'react'
import EmailGenerator from '@/components/EmailGenerator'

export default function EmailsPage() {
  const [prospectName, setProspectName] = useState('')
  const [company, setCompany] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [projectSummary, setProjectSummary] = useState('')

  const inputClass = "px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 bg-white w-full"

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Générateur de mails</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Génère des emails professionnels adaptés à chaque étape du cycle commercial
        </p>
      </div>

      {/* Context */}
      <div className="animate-fade-in-up stagger-1 bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Contexte client</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Nom du contact *</label>
            <input value={prospectName} onChange={e => setProspectName(e.target.value)}
              placeholder="Marie Dupont" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Société</label>
            <input value={company} onChange={e => setCompany(e.target.value)}
              placeholder="ACME SAS" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Montant devis (€ HT)</label>
            <input value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)}
              placeholder="4500" type="number" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Résumé projet</label>
            <input value={projectSummary} onChange={e => setProjectSummary(e.target.value)}
              placeholder="Refonte site e-commerce" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Generator */}
      {prospectName.trim() ? (
        <div className="animate-fade-in-up stagger-2">
          <EmailGenerator
            prospectName={prospectName}
            company={company || null}
            quoteAmount={quoteAmount ? Number(quoteAmount) : null}
            projectSummary={projectSummary || null}
          />
        </div>
      ) : (
        <p className="text-sm text-center py-8" style={{ color: '#cbd5e1' }}>
          Renseigne le nom du contact pour générer un email
        </p>
      )}
    </div>
  )
}
