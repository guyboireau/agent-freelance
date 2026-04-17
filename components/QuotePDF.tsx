'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { QuoteLine } from '@/lib/supabase/types'

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 11, color: '#111' },
  header: { marginBottom: 32 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#71717a' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', borderBottom: '1px solid #f4f4f5', paddingVertical: 6 },
  headerRow: { flexDirection: 'row', borderBottom: '1.5px solid #d4d4d8', paddingVertical: 6, backgroundColor: '#fafafa' },
  col1: { flex: 4, paddingRight: 8 },
  col2: { flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', paddingVertical: 8, borderTop: '2px solid #18181b', marginTop: 4 },
  totalLabel: { flex: 4, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  totalValue: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 14 },
  note: { fontSize: 9, color: '#71717a', marginTop: 4, fontStyle: 'italic' },
  conditions: { fontSize: 10, marginTop: 4 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 9, color: '#a1a1aa', textAlign: 'center' },
})

interface QuotePDFDocProps {
  prospectName: string
  company?: string | null
  lines: QuoteLine[]
  total_ht: number
  duration_days: number
  conditions?: string | null
  notes?: string | null
  date: string
}

function QuotePDFDoc({ prospectName, company, lines, total_ht, duration_days, conditions, notes, date }: QuotePDFDocProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Devis</Text>
          <Text style={styles.subtitle}>Guy Boireau — Développeur freelance · boireauguy@gmail.com</Text>
          <Text style={[styles.subtitle, { marginTop: 16 }]}>
            À l&apos;attention de : {prospectName}{company ? ` (${company})` : ''}
          </Text>
          <Text style={styles.subtitle}>Date : {date}</Text>
        </View>

        {/* Lines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestations</Text>
          <View style={styles.headerRow}>
            <Text style={styles.col1}>Prestation</Text>
            <Text style={styles.col2}>Jours</Text>
            <Text style={styles.col2}>PU HT</Text>
            <Text style={styles.col2}>Total HT</Text>
          </View>
          {lines.map((line, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.col1}>{line.label}</Text>
              <Text style={styles.col2}>{line.days}j</Text>
              <Text style={styles.col2}>{line.unit_price}€</Text>
              <Text style={styles.col2}>{line.total}€</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{total_ht}€</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <Text style={styles.conditions}>Durée estimée : {duration_days} jours ouvrés</Text>
          {conditions && <Text style={styles.conditions}>{conditions}</Text>}
          {notes && <Text style={styles.note}>{notes}</Text>}
        </View>

        <Text style={styles.footer}>guyboireau.com — TVA non applicable, article 293B du CGI</Text>
      </Page>
    </Document>
  )
}

export async function downloadQuotePDF(props: QuotePDFDocProps) {
  const blob = await pdf(<QuotePDFDoc {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `devis-${props.prospectName.toLowerCase().replace(/\s+/g, '-')}-${props.date}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
