import { z } from 'zod';

export function normalizePhone(value: unknown): string {
  if (typeof value !== 'string' || !/^\+?[\d\s()-]{8,24}$/.test(value.trim())) return '';
  const phone = value.trim().replace(/[\s()-]/g, '');
  return /^\+?\d{8,15}$/.test(phone) ? phone : '';
}

export function normalizeWhatsapp(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const number = normalizePhone(value);
  if (number) return `https://wa.me/${number.replace(/^\+/, '')}`;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    if (url.hostname === 'wa.me' && /^\/\d{8,15}\/?$/.test(url.pathname)) return url.href;
    if (['api.whatsapp.com', 'www.whatsapp.com', 'whatsapp.com'].includes(url.hostname)
      && url.pathname === '/send' && /^\d{8,15}$/.test(url.searchParams.get('phone') ?? '')) return url.href;
  } catch { /* Invalid values never become links. */ }
  return '';
}

export const supportChannelsSchema = z.object({
  phone_enabled: z.boolean().default(false),
  phone: z.string().trim().max(24).refine(v => !v || Boolean(normalizePhone(v)), 'Invalid phone number').default(''),
  whatsapp_enabled: z.boolean().default(false),
  whatsapp: z.string().trim().max(500).refine(v => !v || Boolean(normalizeWhatsapp(v)), 'Invalid WhatsApp number or link').default(''),
  ticket_enabled: z.boolean().default(false),
});
export type SupportChannelSettings = z.infer<typeof supportChannelsSchema>;
export const disabledSupportChannels = supportChannelsSchema.parse({});
export type PublicSupportChannels = { phone: string; whatsapp: string; ticket_enabled: boolean };
export function resolveSupportChannels(value: unknown): PublicSupportChannels {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    phone: raw.phone_enabled === true ? normalizePhone(raw.phone) : '',
    whatsapp: raw.whatsapp_enabled === true ? normalizeWhatsapp(raw.whatsapp) : '',
    ticket_enabled: raw.ticket_enabled === true,
  };
}