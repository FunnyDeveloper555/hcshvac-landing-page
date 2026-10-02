import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  companyName?: string
  vendorName?: string
  accountNumber?: string
  number?: string
  message?: string
  customer?: string
  media?: Array<{ url: string; name: string; isImage: boolean }>
  replyPhone?: string
}

const text = { fontSize: '14px', color: '#1f2937', lineHeight: '22px', margin: '0 0 8px' }

const VendorRfq = (p: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Price & availability request ${p.number || ''}`}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
        <Heading style={{ fontSize: '20px', color: '#0c2340', margin: '0 0 12px' }}>
          Price &amp; Availability Request {p.number ? `(${p.number})` : ''}
        </Heading>
        {p.vendorName && <Text style={text}>Hello {p.vendorName},</Text>}
        {p.accountNumber && <Text style={text}><b>Our account #:</b> {p.accountNumber}</Text>}
        <Text style={{ ...text, whiteSpace: 'pre-wrap' }}>{p.message}</Text>
        {p.customer && <Text style={{ ...text, whiteSpace: 'pre-wrap' }}><b>Job site:</b> {p.customer}</Text>}
        {(p.media || []).map((m, i) =>
          m.isImage ? (
            <Img key={i} src={m.url} alt={m.name} width="260" style={{ margin: '0 8px 8px 0', display: 'inline-block' }} />
          ) : (
            <Text key={i} style={text}><Link href={m.url}>{m.name}</Link></Text>
          ),
        )}
        <Text style={text}>Please reply with price and availability. Thank you!</Text>
        <Text style={{ ...text, color: '#6b7280' }}>{p.companyName}{p.replyPhone ? ` • ${p.replyPhone}` : ''}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VendorRfq,
  subject: (d: Record<string, any>) => `Price & Availability Request ${d.number || ''} – ${d.companyName || ''}`.trim(),
  displayName: 'Vendor price & availability request',
  previewData: { companyName: 'Best Comfort HVAC', vendorName: 'Johnstone Supply', accountNumber: 'BC-1001', number: 'BCJ-TSK260004', message: 'Need P&A: condenser fan motor HC39GE466 qty 1', customer: 'John Doe, 123 Main St, Joliet IL, (815) 555-0101' },
} satisfies TemplateEntry
