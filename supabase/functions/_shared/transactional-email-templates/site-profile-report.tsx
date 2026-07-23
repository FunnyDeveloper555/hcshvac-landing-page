import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  companyName?: string
  reportNumber?: string
  notes?: string
}

const SiteProfileReport = ({ customerName, companyName, reportNumber, notes }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Site Profile Report {reportNumber || ''}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }}>
        <Heading style={{ fontSize: '22px', color: '#0c2340', margin: '0 0 20px' }}>
          Site Profile Report
        </Heading>
        {reportNumber && (
          <Section style={{ backgroundColor: '#f5f7fa', borderLeft: '4px solid #0c2340', padding: '12px 16px', margin: '0 0 24px', borderRadius: '4px' }}>
            <Text style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 4px' }}>Report Number</Text>
            <Text style={{ fontSize: '15px', fontWeight: 600, color: '#0c2340', margin: 0, fontFamily: 'monospace' }}>{reportNumber}</Text>
          </Section>
        )}
        {customerName && <Text style={text}>Hi {customerName},</Text>}
        <Text style={text}>
          Attached is a copy of the Site Profile Report{companyName ? ` completed by ${companyName}` : ''} for your records.
        </Text>
        {notes && (
          <Section style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', padding: '12px 16px', margin: '0 0 16px', borderRadius: '4px' }}>
            <Text style={{ fontSize: '11px', textTransform: 'uppercase', color: '#92400e', margin: '0 0 4px' }}>Notes</Text>
            <Text style={{ fontSize: '14px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{notes}</Text>
          </Section>
        )}
        <Text style={text}>
          Please keep this document for your records. If you have any questions, reply to this email.
        </Text>
        <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
        <Text style={{ fontSize: '14px', color: '#0c2340', fontWeight: 600, margin: '8px 0 0' }}>
          HCS Inc.{companyName ? <><br />{companyName}</> : null}
        </Text>
      </Container>
    </Body>
  </Html>
)

const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }

export const template = {
  component: SiteProfileReport,
  subject: (data: Record<string, any>) =>
    `Your Site Profile Report${data?.reportNumber ? ` — ${data.reportNumber}` : ''}`,
  displayName: 'Site Profile Report',
  previewData: {
    customerName: 'Jane Doe',
    companyName: 'Best Comfort HVAC',
    reportNumber: 'SPR-26-BCJ-01',
    notes: 'Copy of your on-site profile.',
  },
} satisfies TemplateEntry
