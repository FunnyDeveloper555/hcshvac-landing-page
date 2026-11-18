import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Fin { name: string; months: number; apr: number; monthly: number }
interface Line { title: string; description?: string; qty: number; total: number; included?: string[]; finance?: Fin[] }
interface Props {
  companyName?: string; customerName?: string; estimateNumber?: string; estDate?: string; validUntil?: string
  rep?: { name?: string; phone?: string; email?: string }
  lines?: Line[]; subtotal?: number; discount?: number; total?: number; totalFinance?: Fin[]
}

const money = (n?: number) => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '22px', margin: '0 0 10px' }
const small = { fontSize: '13px', color: '#4b5563', margin: '2px 0' }

const FinanceList = ({ items }: { items?: Fin[] }) => !items?.length ? null : (
  <Section style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '10px 12px', marginTop: '8px' }}>
    <Text style={{ ...small, fontWeight: 700, color: '#0c2340' }}>{items.length === 1 ? 'Financing chosen' : 'Financing options'}</Text>
    {items.map((f, i) => (
      <Text key={i} style={small}>{f.name} · {f.apr}% APR — <b>{money(f.monthly)}/mo</b></Text>
    ))}
  </Section>
)

const CustomerEstimate = ({ companyName, customerName, estimateNumber, estDate, validUntil, rep, lines = [], subtotal, discount, total, totalFinance }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your estimate{estimateNumber ? ` ${estimateNumber}` : ''} from {companyName || 'us'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Container style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <Heading style={{ fontSize: '22px', color: '#0c2340', margin: '0 0 6px' }}>Estimate {estimateNumber || ''}</Heading>
        <Text style={small}>{estDate ? `Date: ${estDate}` : ''}{validUntil ? ` · Valid until ${validUntil}` : ''}</Text>
        <Hr />
        {customerName && <Text style={text}>Hi {customerName},</Text>}
        <Text style={text}>Thank you for considering {companyName || 'us'}. Here is your estimate.</Text>
        {lines.map((l, i) => (
          <Section key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px', margin: '0 0 12px' }}>
            <Text style={{ fontSize: '15px', fontWeight: 700, color: '#0c2340', margin: '0 0 4px' }}>{l.title}{l.qty > 1 ? ` × ${l.qty}` : ''}</Text>
            {l.description && <Text style={small}>{l.description}</Text>}
            {l.included?.map((x, j) => <Text key={j} style={small}>• {x}</Text>)}
            <Text style={{ ...text, fontWeight: 700, margin: '8px 0 0' }}>{money(l.total)}</Text>
            <FinanceList items={l.finance} />
          </Section>
        ))}
        <Hr />
        <Text style={text}>Subtotal: {money(subtotal)}</Text>
        {!!discount && <Text style={text}>Discount: −{money(discount)}</Text>}
        <Text style={{ ...text, fontSize: '18px', fontWeight: 700 }}>Total: {money(total)}</Text>
        <FinanceList items={totalFinance} />
        {rep?.name && (
          <Text style={{ ...small, marginTop: '20px' }}>Questions? Contact {rep.name}{rep.phone ? ` · ${rep.phone}` : ''}{rep.email ? ` · ${rep.email}` : ''}</Text>
        )}
        <Text style={{ ...small, marginTop: '12px' }}>Monthly payments are estimates and subject to credit approval.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomerEstimate,
  subject: (d: Record<string, any>) => `Your estimate${d?.estimateNumber ? ` ${d.estimateNumber}` : ''}${d?.companyName ? ` from ${d.companyName}` : ''}`,
  displayName: 'Customer Estimate',
  previewData: {
    companyName: 'Blue Flame Heating & Cooling', customerName: 'Jane Doe', estimateNumber: 'EST-2026-0001', estDate: '2026-11-18', validUntil: '11/28/2026',
    rep: { name: 'Trey', phone: '815-555-0100' },
    lines: [{ title: 'Furnace & AC Bundle', description: 'Bundle 3 — Furnace, Condenser & Coil', qty: 1, total: 8500, included: ['80% Furnace', '3-Ton AC', 'Coil'],
      finance: [{ name: '60 months', months: 60, apr: 9.99, monthly: 180.56 }, { name: '120 months', months: 120, apr: 9.99, monthly: 112.28 }] }],
    subtotal: 8500, discount: 0, total: 8500,
  },
} satisfies TemplateEntry
