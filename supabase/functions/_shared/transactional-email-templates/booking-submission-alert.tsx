import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  firstName?: string
  lastName?: string
  customerAddress?: string
  customerPhone?: string
  customerEmail?: string
  companyName?: string
  isBooking?: boolean
  suggestedDate?: string
  suggestedTime?: string
  appointmentType?: string
  notes?: string
  appointmentNumber?: string
  submittedAt?: string
  adminUrl?: string
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Text style={row}><span style={rowLabel}>{label}:</span> {value || '—'}</Text>
)

const BookingSubmissionAlert = (p: Props) => {
  const title = p.isBooking === false ? 'Registration Submitted' : 'Appointment Requested'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title} — {p.customerName || 'customer'} {p.suggestedDate ? `for ${p.suggestedDate}` : ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          {p.isBooking !== false && (
            <Section style={suggestBox}>
              <Text style={suggestLine}>Suggested {p.suggestedDate || '(no date given)'}</Text>
              <Text style={suggestLine}>{p.suggestedTime || '(no time given)'}</Text>
              <Text style={approval}>Needs Approval or modification</Text>
            </Section>
          )}

          <Section style={infoBox}>
            <Row label="First" value={p.firstName} />
            <Row label="Last" value={p.lastName} />
            <Row label="Address" value={p.customerAddress} />
            <Row label="Phone" value={p.customerPhone} />
            <Row label="Email" value={p.customerEmail} />
            <Row label="Attn" value={p.companyName} />
            {p.isBooking !== false && <Row label="Appointment Type requested" value={p.appointmentType} />}
            {p.appointmentNumber && <Row label="Appointment #" value={p.appointmentNumber} />}
          </Section>

          {p.isBooking !== false && (
            <>
              <Text style={rowLabel}>Appointment notes:</Text>
              <Section style={notesBox}>
                <Text style={notesText}>{p.notes || 'No notes provided.'}</Text>
              </Section>
            </>
          )}

          {p.adminUrl && (
            <Text style={row}>
              <Link href={p.adminUrl} style={link}>Open this appointment to approve or modify</Link>
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>Home Comfort Suppliers Inc. — staff notification{p.submittedAt ? ` · submitted ${p.submittedAt}` : ''}</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { margin: '0 auto', padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', color: '#0c2340', margin: '0 0 12px' }
const suggestBox = { backgroundColor: '#fff7ed', borderLeft: '4px solid #f59e0b', padding: '10px 16px', margin: '0 0 16px', borderRadius: '4px' }
const suggestLine = { fontSize: '16px', fontWeight: 'bold' as const, color: '#111827', margin: '2px 0' }
const approval = { fontSize: '14px', color: '#b45309', fontWeight: 'bold' as const, margin: '6px 0 0' }
const infoBox = { backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '10px 16px', margin: '0 0 16px' }
const row = { fontSize: '14px', color: '#111827', margin: '4px 0', lineHeight: '20px' }
const rowLabel = { fontSize: '14px', color: '#6b7280', fontWeight: 'bold' as const }
const notesBox = { border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px 14px', margin: '4px 0 16px', minHeight: '60px' }
const notesText = { fontSize: '14px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' as const }
const link = { color: '#2563eb', textDecoration: 'underline', fontWeight: 'bold' as const }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#9ca3af' }

export const template: TemplateEntry = {
  component: BookingSubmissionAlert,
  subject: (d) => d.isBooking === false
    ? `Registration submitted — ${d.customerName || 'customer'}`
    : `Appointment Requested — ${d.customerName || 'customer'}${d.suggestedDate ? ` — ${d.suggestedDate}` : ''} (Needs approval)`,
  displayName: 'Booking submission alert (staff)',
  previewData: {
    customerName: 'Jane Doe', firstName: 'Jane', lastName: 'Doe',
    customerAddress: '123 Main St, Joliet, IL 60435',
    customerPhone: '(555) 123-4567', customerEmail: 'jane@example.com',
    companyName: 'Best Comfort HVAC Joliet Office', isBooking: true,
    suggestedDate: '01-01-2027', suggestedTime: '1 PM to 3 PM',
    appointmentType: 'Repairs Boilers', notes: 'Boiler making noise at night.',
    submittedAt: 'Oct 7, 2026 2:15 PM',
    adminUrl: 'https://hcshvac.com/admin/appointments/add?edit=example',
  },
}
