import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface Props {
  customerName?: string
  companyName?: string
  bookingUrl: string
  notes?: string
}

const BookingInvite = ({ customerName, companyName, bookingUrl, notes }: Props) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Complete your booking with {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Complete Your Booking</Heading>

          <Section style={infoBox}>
            <Text style={infoLabel}>Company</Text>
            <Text style={infoValue}>{company}</Text>
          </Section>

          {customerName && <Text style={text}>Hi {customerName},</Text>}

          <Text style={text}>
            {company} has sent you a secure link to complete your profile and
            schedule an appointment. It only takes a couple of minutes.
          </Text>

          {notes && (
            <Section style={notesBox}>
              <Text style={notesLabel}>Notes</Text>
              <Text style={notesValue}>{notes}</Text>
            </Section>
          )}

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={bookingUrl} style={button}>Book My Appointment</Button>
          </Section>

          <Text style={smallText}>
            If the button doesn't work, copy and paste this link into your browser:
            <br />
            <span style={{ wordBreak: 'break-all', color: '#0c2340' }}>{bookingUrl}</span>
          </Text>

          <Hr style={hr} />

          <Text style={signature}>
            HCS Inc.<br />
            {company}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingInvite,
  subject: (data: Record<string, any>) =>
    `Complete your booking — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Booking Invite',
  previewData: {
    customerName: 'Jane Doe',
    companyName: 'Best Comfort HVAC',
    bookingUrl: 'https://example.com/book/abc123',
    notes: 'Initial visit for HVAC tune-up',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c2340', margin: '0 0 20px', lineHeight: '1.3' }
const infoBox = { backgroundColor: '#f5f7fa', borderLeft: '4px solid #0c2340', padding: '12px 16px', margin: '0 0 24px', borderRadius: '4px' }
const infoLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: '0.5px', margin: '0 0 4px' }
const infoValue = { fontSize: '15px', fontWeight: '600' as const, color: '#0c2340', margin: '0' }
const notesBox = { backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', padding: '12px 16px', margin: '0 0 16px', borderRadius: '4px' }
const notesLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#92400e', letterSpacing: '0.5px', margin: '0 0 4px' }
const notesValue = { fontSize: '14px', color: '#374151', margin: '0', whiteSpace: 'pre-wrap' as const }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '12px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 16px', textAlign: 'center' as const }
const button = {
  backgroundColor: '#0c2340', color: '#ffffff', padding: '12px 24px',
  borderRadius: '6px', fontSize: '14px', fontWeight: '600' as const,
  textDecoration: 'none', display: 'inline-block',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const signature = { fontSize: '14px', color: '#0c2340', fontWeight: '600' as const, lineHeight: '1.5', margin: '8px 0 0' }
