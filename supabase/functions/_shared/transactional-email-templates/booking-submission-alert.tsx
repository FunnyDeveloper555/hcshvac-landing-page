import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  companyName?: string
  isBooking?: boolean
  submittedAt?: string
  adminUrl?: string
}

const BookingSubmissionAlert = ({
  customerName, customerPhone, customerEmail, companyName, isBooking, submittedAt, adminUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {isBooking ? 'booking' : 'registration'} submission from {customerName || 'a customer'} — {companyName || 'HCS'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New {isBooking ? 'booking' : 'registration'} submission</Heading>
        <Text style={text}>
          A customer just finished the {isBooking ? 'booking' : 'registration'} link you sent.
          Review it in the admin panel and confirm the appointment.
        </Text>
        <Section style={infoBox}>
          {customerName && (<><Text style={infoLabel}>Customer</Text><Text style={infoValue}>{customerName}</Text></>)}
          {customerPhone && (<><Text style={infoLabel}>Phone</Text><Text style={infoValue}>{customerPhone}</Text></>)}
          {customerEmail && (<><Text style={infoLabel}>Email</Text><Text style={infoValue}>{customerEmail}</Text></>)}
          {companyName && (<><Text style={infoLabel}>Company</Text><Text style={infoValue}>{companyName}</Text></>)}
          {submittedAt && (<><Text style={infoLabel}>Submitted</Text><Text style={infoValue}>{submittedAt}</Text></>)}
        </Section>
        {adminUrl && (
          <Text style={text}>
            <Link href={adminUrl} style={link}>Open the admin panel</Link>
          </Text>
        )}
        <Hr style={hr} />
        <Text style={footer}>Home Comfort Suppliers Inc. — staff notification</Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '24px', maxWidth: '560px', borderRadius: '8px' }
const h1 = { fontSize: '20px', color: '#111827' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '22px' }
const infoBox = { backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '12px 16px', margin: '12px 0' }
const infoLabel = { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' as const, margin: '8px 0 0' }
const infoValue = { fontSize: '14px', color: '#111827', margin: '0 0 4px' }
const link = { color: '#2563eb', textDecoration: 'underline' }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#9ca3af' }

export const template: TemplateEntry = {
  component: BookingSubmissionAlert,
  subject: (d) => `New ${d.isBooking ? 'booking' : 'registration'} submission — ${d.customerName || 'customer'}`,
  previewData: {
    customerName: 'Jane Doe',
    customerPhone: '(555) 123-4567',
    customerEmail: 'jane@example.com',
    companyName: 'Best Comfort HVAC Joliet Office',
    isBooking: true,
    submittedAt: 'Oct 7, 2026 2:15 PM',
    adminUrl: 'https://hcshvac.com/admin/screenpops/sms',
  },
}
