import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const PARENT_COMPANY = 'Home Comfort Suppliers Inc.'

interface Props {
  customerName?: string
  companyName?: string
  companyPhone?: string
  isBooking?: boolean
  visitReason?: string
  preferredDate?: string
  preferredTime?: string
  address?: string
}

const BookingReceived = ({
  customerName, companyName, companyPhone, isBooking, visitReason, preferredDate, preferredTime, address,
}: Props) => {
  const company = companyName || PARENT_COMPANY
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We received your {isBooking ? 'booking request' : 'registration'} — {company}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{isBooking ? 'We received your booking request' : 'We received your registration'}</Heading>

          <Text style={text}>{customerName ? `Hi ${customerName},` : 'Hi there,'}</Text>

          <Text style={text}>
            Thank you — {company} has received your {isBooking ? 'appointment request' : 'information'}.
            {isBooking
              ? ' This is a receipt only. Your appointment is not confirmed yet. A member of our team will review it and send you a separate confirmation with the final date and time.'
              : ' A member of our team will be in touch soon.'}
          </Text>

          {isBooking && (
            <Section style={infoBox}>
              {visitReason && (<><Text style={infoLabel}>Reason for visit</Text><Text style={infoValue}>{visitReason}</Text></>)}
              {preferredDate && (<><Text style={infoLabel}>Requested date</Text><Text style={infoValue}>{preferredDate}</Text></>)}
              {preferredTime && (<><Text style={infoLabel}>Requested time</Text><Text style={infoValue}>{preferredTime}</Text></>)}
              {address && (<><Text style={infoLabel}>Service address</Text><Text style={infoValue}>{address}</Text></>)}
            </Section>
          )}

          <Text style={text}>
            {companyPhone ? `Questions? Call us at ${companyPhone} or reply to this email.` : 'Questions? Just reply to this email.'}
          </Text>

          <Hr style={hr} />
          <Text style={signature}>HCS Inc.<br />{company}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingReceived,
  subject: (data: Record<string, any>) =>
    `${data?.isBooking ? 'Booking request received' : 'Registration received'} — ${data?.companyName || PARENT_COMPANY}`,
  displayName: 'Booking Received (Receipt)',
  previewData: {
    customerName: 'Jane Doe',
    companyName: 'Best Comfort HVAC',
    companyPhone: '(815) 555-0100',
    isBooking: true,
    visitReason: 'Humidifier Repair',
    preferredDate: '2026-10-05',
    preferredTime: '10:00 AM',
    address: '123 Main St, Joliet, IL 60431',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0c2340', margin: '0 0 20px', lineHeight: '1.3' }
const infoBox = { backgroundColor: '#f5f7fa', borderLeft: '4px solid #0c2340', padding: '12px 16px', margin: '0 0 16px', borderRadius: '4px' }
const infoLabel = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: '0.5px', margin: '8px 0 2px' }
const infoValue = { fontSize: '15px', fontWeight: '600' as const, color: '#0c2340', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const signature = { fontSize: '14px', color: '#0c2340', fontWeight: '600' as const, lineHeight: '1.5', margin: '8px 0 0' }
