'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/chat', label: 'Chat agent', icon: '◎' },
  { href: '/followups', label: 'À relancer', icon: '◷' },
  { href: '/linkedin', label: 'Posts LinkedIn', icon: '⬡' },
  { href: '/emails', label: 'Générateur mails', icon: '✉' },
  { href: '/compare', label: 'Comparer modèles', icon: '⇄' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <>
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              color: active ? '#0f172a' : '#475569',
              background: active ? '#f1f5f9' : 'transparent',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = '#f1f5f9'
                ;(e.currentTarget as HTMLElement).style.color = '#0f172a'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = '#475569'
              }
            }}
          >
            <span style={{ fontSize: 16, opacity: 0.6 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
