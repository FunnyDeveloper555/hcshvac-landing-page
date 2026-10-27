import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  senderName?: string
  phone?: string
  message?: string
  receivedAt?: string
  chatUrl?: string
}

const ChatUnrepliedAlert = (p: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Unanswered chat from {p.senderName || 'a customer'} (10+ minutes)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Chat not answered in 10 minutes</Heading>
        <Text style={row}><b>From:</b> {p.senderName || '—'} {p.phone ? `(${p.phone})` : ''}</Text>
        <Text style={row}><b>Received:</b> {p.receivedAt || '—'}</Text>
        <Text style={quote}>{p.message || '(no text)'}</Text>
        {p.chatUrl && <Link href={p.chatUrl} style={btn}>Open chat and reply</Link>}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ChatUnrepliedAlert,
  subject: (d: Record<string, any>) => `Unanswered chat: ${d.senderName || 'customer'}`,
  displayName: 'Chat unreplied alert',
  previewData: { senderName: 'Lori Best', phone: '+16305551234', message: 'Is someone coming today?', receivedAt: 'Oct 27, 10:02 AM', chatUrl: 'https://hcshvac.com/admin/chat' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '20px', color: '#b91c1c' }
const row = { fontSize: '14px', margin: '4px 0' }
const quote = { fontSize: '14px', padding: '10px', borderLeft: '3px solid #b91c1c', backgroundColor: '#fef2f2' }
const btn = { display: 'inline-block', marginTop: '12px', padding: '10px 16px', backgroundColor: '#b91c1c', color: '#ffffff', borderRadius: '6px', textDecoration: 'none' }
