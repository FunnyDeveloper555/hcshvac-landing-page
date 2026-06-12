import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface Props {
  customerName?: string
  companyName?: string
  scheduledDate?: string
  scheduledTime?: string
  address?: string
  notes?: string
}

const AppointmentConfirmation = ({ customerName, companyName, scheduledDate, scheduledTime, address, notes }: Props) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your appointment with {company} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your appointment is confirmed</Heading>

          {customerName && <Text style={text}>Hi {customerName},</Text>}

          <Text style={text}>
            Good news — {company} has confirmed your appointment. Here are the details:
          </Text>

          <Section style={infoBox}>
            {scheduledDate && (
              <>
                <Text style={infoLabel}>Date</Text>
                <Text style={infoValue}>{scheduledDate}</Text>
              </>
            )}
            {scheduledTime && (
              <>
                <Text style={infoLabel}>Time</Text>
                <Text style={infoValue}>{scheduledTime}</Text>
              </>
            )}
            {address && (
              <>
                <Text style={infoLabel}>Service address</Text>
                <Text style={infoValue}>{address}</Text>
              </>
            )}
          </Section>

          {notes && (
            <Section style={notesBox}>
              <Text style={notesLabel}>Notes</Text>
              <Text style={notesValue}>{notes}</Text>
            </Section>
          )}

          <Text style={text}>
            If anything changes or you need to reschedule, just reply to this
            email and we'll take care of it.
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
  component: AppointmentConfirmation,
  subject: (data: Record<string, any>) =>
    `Appointment confirmed — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Appointment Confirmation',
  previewData: {
    customerName: 'Jane Doe',
    companyName: 'Best Comfort HVAC',
    scheduledDate: 'Mon, Jun 15, 2026',
    scheduledTime: '10:00 AM',
    address: '123 Main St, Springfield',
    notes: 'Tech will call 15 minutes before arrival.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c2340', margin: '0 0 20px', lineHeight: '1.3' }
const infoBox = { backgroundColor: '#f5f7fa', borderLeft: '4px solid #0c2340', padding: '12px 16px', margin: '0 0 16px', borderRadius: '4px' }
const infoLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: '0.5px', margin: '8px 0 2px' }
const infoValue = { fontSize: '15px', fontWeight: '600' as const, color: '#0c2340', margin: '0' }
const notesBox = { backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', padding: '12px 16px', margin: '0 0 16px', borderRadius: '4px' }
const notesLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#92400e', letterSpacing: '0.5px', margin: '0 0 4px' }
const notesValue = { fontSize: '14px', color: '#374151', margin: '0', whiteSpace: 'pre-wrap' as const }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const signature = { fontSize: '14px', color: '#0c2340', fontWeight: '600' as const, lineHeight: '1.5', margin: '8px 0 0' }
