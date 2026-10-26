import { describe, expect, it } from 'vitest';
import { resolveSupportChannels, supportChannelsSchema, normalizeWhatsapp } from './support-channels';

describe('optional customer-service channels', () => {
  it('disables all channels when configuration is absent', () => {
    expect(resolveSupportChannels(null)).toEqual({phone:'',whatsapp:'',ticket_enabled:false});
  });
  it('shows the configured enabled phone number', () => {
    expect(resolveSupportChannels({phone_enabled:true,phone:'920007168'}).phone).toBe('920007168');
  });
  it('hides a populated phone when disabled', () => {
    expect(resolveSupportChannels({phone_enabled:false,phone:'920007168'}).phone).toBe('');
  });
  it('hides a phone when enabled but empty or invalid', () => {
    expect(resolveSupportChannels({phone_enabled:true,phone:''}).phone).toBe('');
    expect(resolveSupportChannels({phone_enabled:true,phone:'javascript:alert(1)'}).phone).toBe('');
  });
  it('shows the enabled official WhatsApp link', () => {
    expect(resolveSupportChannels({whatsapp_enabled:true,whatsapp:'https://wa.me/966500000000'}).whatsapp).toBe('https://wa.me/966500000000');
  });
  it('accepts international WhatsApp numbers', () => {
    expect(normalizeWhatsapp('+966 50 000 0000')).toBe('https://wa.me/966500000000');
  });
  it('hides a populated WhatsApp channel when disabled', () => {
    expect(resolveSupportChannels({whatsapp_enabled:false,whatsapp:'https://wa.me/966500000000'}).whatsapp).toBe('');
  });
  it('hides empty and unsafe WhatsApp destinations', () => {
    for (const whatsapp of ['', 'https://example.com', 'https://wa.me/', 'https://wa.me/invalid','https://wa.me@evil.example/966500000000']) {
      expect(resolveSupportChannels({whatsapp_enabled:true,whatsapp}).whatsapp).toBe('');
    }
  });
  it('enables the ticket form independently of direct channels', () => {
    expect(resolveSupportChannels({ticket_enabled:true})).toEqual({phone:'',whatsapp:'',ticket_enabled:true});
  });
  it('does not treat string false as an enabled form', () => {
    expect(resolveSupportChannels({ticket_enabled:'false'}).ticket_enabled).toBe(false);
  });
  it('allows enabled channels with blank inputs but rejects malformed values on save', () => {
    expect(supportChannelsSchema.safeParse({phone_enabled:true,phone:'',whatsapp_enabled:true,whatsapp:''}).success).toBe(true);
    expect(supportChannelsSchema.safeParse({phone:'bad'}).success).toBe(false);
    expect(supportChannelsSchema.safeParse({whatsapp:'https://evil.example'}).success).toBe(false);
  });
});