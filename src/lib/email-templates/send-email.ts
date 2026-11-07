import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from './registry'
import { notificationSender, NOTIFICATION_SENDER_NAME } from '../notification-policy'

// Server-only credentials are resolved for every send, never in browser code.
const SITE_NAME = NOTIFICATION_SENDER_NAME
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend"

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: string; status?: number }

export class ResendDeliveryError extends Error {
  constructor(public code: string, public status: number, public providerBody: string) {
    super(`Resend request failed [${status}]: ${providerBody}`)
  }
}

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string
  replyTo?: string
  cc?: string[]
  fromName?: string
  fromEmail?: string | null
}

/**
 * Renders a registered template and submits a single transactional Resend email.
 * Resend failures retain their status and body for authenticated diagnostics.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string | string[],
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env['LOVABLE_API_KEY']
  const resendKey = process.env['RESEND_API_KEY']
  if (!apiKey || !resendKey) return { sent: false, reason: 'missing_api_key' }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  // Optional fixed-recipient templates override the caller's routing.
  const recipient = template.to || to
  if (!recipient || (Array.isArray(recipient) && !recipient.length)) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Connection-Api-Key': resendKey,
      'Idempotency-Key': options.idempotencyKey || crypto.randomUUID(),
    },
    body: JSON.stringify({
      to: Array.isArray(recipient) ? recipient : [recipient],
      from: `${SITE_NAME} <${notificationSender()}>`,
      subject, html, text,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      ...(options.cc?.length ? { cc: options.cc } : {}),
    }),
  })
  if (!response.ok) {
    const providerBody = await response.text()
    let code = 'error'
    try { code = JSON.parse(providerBody).name || 'error' } catch { /* Non-JSON provider response. */ }
    throw new ResendDeliveryError(code, response.status, providerBody)
  }
  const result = await response.json() as { id?: string }
  if (!result.id) throw new ResendDeliveryError('error', response.status, 'Missing email ID')
  return { sent: true }
}
