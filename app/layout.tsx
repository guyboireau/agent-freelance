import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Agent Freelance',
  description: 'Assistant commercial IA pour freelance tech',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-zinc-50 text-zinc-900">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-white border-r border-zinc-200 flex flex-col py-6 px-4 gap-1">
          <div className="text-sm font-bold text-zinc-900 mb-6 px-2">Agent Freelance</div>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/chat">Chat agent</NavLink>
          <NavLink href="/followups">À relancer</NavLink>
        </aside>
        {/* Main */}
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2 py-1.5 rounded-md text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition"
    >
      {children}
    </Link>
  )
}
