'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { QuoteLine } from '@/lib/supabase/types'
import { FREELANCER } from '@/lib/freelancer'

const C = {
  black: '#0f172a',
  gray: '#64748b',
  lightGray: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  accent: '#0f172a',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: C.black, backgroundColor: C.white },

  // En-tête deux colonnes
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  freelancerName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 4 },
  freelancerDetail: { fontSize: 9, color: C.gray, marginBottom: 2 },
  devisTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 6 },
  devisRef: { fontSize: 10, color: C.gray, marginBottom: 3 },

  // Bloc client
  clientBlock: { backgroundColor: C.bg, padding: 14, borderRadius: 4, marginBottom: 28, flexDirection: 'row', justifyContent: 'space-between' },
  clientSection: { flex: 1 },
  clientSectionRight: { flex: 1, alignItems: 'flex-end' },
  blockLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  clientName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 2 },
  clientDetail: { fontSize: 9, color: C.gray, marginBottom: 2 },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: C.black, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 3, marginBottom: 2 },
  tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottom: `1px solid ${C.border}` },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` },
  colLabel: { flex: 5 },
  colDays: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  cellText: { fontSize: 10, color: C.black },
  cellTextGray: { fontSize: 10, color: C.gray },

  // Total
  totalBlock: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 24 },
  totalInner: { width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 9, color: C.gray },
  totalValue: { fontSize: 9, color: C.gray },
  totalFinalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTop: `2px solid ${C.black}`, marginTop: 4 },
  totalFinalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.black },
  totalFinalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.black },

  // Conditions
  condSection: { marginBottom: 20 },
  condTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  condRow: { flexDirection: 'row', marginBottom: 4 },
  condBullet: { fontSize: 9, color: C.gray, marginRight: 6, marginTop: 1 },
  condText: { fontSize: 9, color: C.gray, flex: 1, lineHeight: 1.5 },

  // Durée & note
  note: { fontSize: 8, color: C.lightGray, fontStyle: 'italic', marginTop: 4 },

  // Signature
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  sigBox: { width: 200, borderTop: `1px solid ${C.border}`, paddingTop: 8 },
  sigLabel: { fontSize: 8, color: C.lightGray },

  // Footer
  footer: { position: 'absolute', bottom: 28, left: 48, right: 48 },
  footerLine: { borderTop: `1px solid ${C.border}`, marginBottom: 6 },
  footerText: { fontSize: 8, color: C.lightGray, textAlign: 'center' },
})

interface QuotePDFDocProps {
  prospectName: string
  company?: string | null
  email?: string | null
  phone?: string | null
  siret?: string | null
  address?: string | null
  lines: QuoteLine[]
  total_ht: number
  duration_days: number
  conditions?: string | null
  notes?: string | null
  date: string
  quoteRef: string
  validUntil: string
}

function QuotePDFDoc({ prospectName, company, email, phone, siret, address, lines, total_ht, duration_days, conditions, notes, date, quoteRef, validUntil }: QuotePDFDocProps) {
  const deposit = Math.round(total_ht * FREELANCER.deposit_percent / 100)
  const balance = total_ht - deposit

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-tête */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.freelancerName}>{FREELANCER.name}</Text>
            <Text style={styles.freelancerDetail}>{FREELANCER.title}</Text>
            <Text style={styles.freelancerDetail}>{FREELANCER.email}</Text>
            <Text style={styles.freelancerDetail}>{FREELANCER.website}</Text>
            {FREELANCER.phone && <Text style={styles.freelancerDetail}>{FREELANCER.phone}</Text>}
            {FREELANCER.address && <Text style={styles.freelancerDetail}>{FREELANCER.address}</Text>}
            {FREELANCER.siret && <Text style={styles.freelancerDetail}>SIRET : {FREELANCER.siret}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.devisTitle}>Devis</Text>
            <Text style={styles.devisRef}>Réf. {quoteRef}</Text>
            <Text style={styles.devisRef}>Date : {date}</Text>
            <Text style={styles.devisRef}>Valable jusqu&apos;au : {validUntil}</Text>
          </View>
        </View>

        {/* Bloc client */}
        <View style={styles.clientBlock}>
          <View style={styles.clientSection}>
            <Text style={styles.blockLabel}>Client</Text>
            <Text style={styles.clientName}>{prospectName}</Text>
            {company && <Text style={styles.clientDetail}>{company}</Text>}
            {email && <Text style={styles.clientDetail}>{email}</Text>}
            {phone && <Text style={styles.clientDetail}>{phone}</Text>}
            {address && <Text style={styles.clientDetail}>{address}</Text>}
            {siret && <Text style={styles.clientDetail}>SIRET : {siret}</Text>}
          </View>
          <View style={styles.clientSectionRight}>
            <Text style={styles.blockLabel}>Prestataire</Text>
            <Text style={styles.clientName}>{FREELANCER.name}</Text>
            <Text style={styles.clientDetail}>TJM {FREELANCER.tjm}€ / jour</Text>
            <Text style={styles.clientDetail}>Durée : {duration_days} j. ouvrés</Text>
          </View>
        </View>

        {/* Tableau prestations */}
        <View style={{ marginBottom: 4 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colLabel]}>Prestation</Text>
            <Text style={[styles.tableHeaderText, styles.colDays]}>Jours</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>PU HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {lines.map((line, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.cellText, styles.colLabel]}>{line.label}</Text>
              <Text style={[styles.cellTextGray, styles.colDays]}>{line.days}j</Text>
              <Text style={[styles.cellTextGray, styles.colUnit]}>{line.unit_price.toLocaleString('fr-FR')}€</Text>
              <Text style={[styles.cellText, styles.colTotal]}>{line.total.toLocaleString('fr-FR')}€</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totalBlock}>
          <View style={styles.totalInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{total_ht.toLocaleString('fr-FR')}€</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>Non applicable</Text>
            </View>
            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>Total TTC</Text>
              <Text style={styles.totalFinalValue}>{total_ht.toLocaleString('fr-FR')}€</Text>
            </View>
          </View>
        </View>

        {/* Conditions de paiement */}
        <View style={styles.condSection}>
          <Text style={styles.condTitle}>Conditions de paiement</Text>
          <View style={styles.condRow}>
            <Text style={styles.condBullet}>•</Text>
            <Text style={styles.condText}>Acompte à la commande ({FREELANCER.deposit_percent}%) : {deposit.toLocaleString('fr-FR')}€ HT</Text>
          </View>
          <View style={styles.condRow}>
            <Text style={styles.condBullet}>•</Text>
            <Text style={styles.condText}>Solde à la livraison ({100 - FREELANCER.deposit_percent}%) : {balance.toLocaleString('fr-FR')}€ HT</Text>
          </View>
          <View style={styles.condRow}>
            <Text style={styles.condBullet}>•</Text>
            <Text style={styles.condText}>Règlement : {conditions ?? FREELANCER.payment_terms}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.condSection}>
            <Text style={styles.condTitle}>Notes</Text>
            <Text style={styles.condText}>{notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.sigBlock}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Signature du prestataire</Text>
            <Text style={[styles.sigLabel, { marginTop: 24 }]}>{FREELANCER.name}</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Bon pour accord — date et signature client</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            {FREELANCER.name} · {FREELANCER.email} · {FREELANCER.website}
            {FREELANCER.siret ? ` · SIRET ${FREELANCER.siret}` : ''} · {FREELANCER.tva_mention}
          </Text>
        </View>

      </Page>
    </Document>
  )
}

function buildQuoteRef(prospectName: string): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const initials = prospectName
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3)
  return `DEV-${year}${month}-${initials}`
}

function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('/').map(Number)
  const d = new Date(parts[2], parts[1] - 1, parts[0])
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('fr-FR')
}

export async function downloadQuotePDF(props: Omit<QuotePDFDocProps, 'quoteRef' | 'validUntil'>) {
  const quoteRef = buildQuoteRef(props.prospectName)
  const validUntil = addDays(props.date, 30)
  const fullProps = { ...props, quoteRef, validUntil }

  const blob = await pdf(<QuotePDFDoc {...fullProps} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `devis-${props.prospectName.toLowerCase().replace(/\s+/g, '-')}-${props.date.replace(/\//g, '-')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
  return blob
}
