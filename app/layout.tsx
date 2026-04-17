import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import SidebarNav from '@/components/SidebarNav'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Agent Freelance',
  description: 'Assistant commercial IA pour freelance tech',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={geist.variable} style={{ colorScheme: 'light' }}>
      <body className="min-h-screen flex" style={{ background: '#f8fafc', color: '#0f172a' }}>
        {/* Sidebar */}
        <aside className="w-60 shrink-0 flex flex-col py-8 px-4 gap-1"
          style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
          <div className="px-3 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: '#94a3b8' }}>Agent</p>
            <p className="text-lg font-bold" style={{ color: '#0f172a' }}>Freelance</p>
          </div>

          <SidebarNav />

          <div className="mt-auto px-3 pt-6 border-t" style={{ borderColor: '#f1f5f9' }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Guy Boireau</p>
            <p className="text-xs" style={{ color: '#cbd5e1' }}>TJM 350€/j</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto animate-fade-in">{children}</main>
      </body>
    </html>
  )
}
