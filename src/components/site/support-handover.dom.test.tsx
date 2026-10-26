// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('@tanstack/react-start', () => ({useServerFn: (fn: unknown) => fn}));
vi.mock('@/lib/assistant.functions', () => ({submitSupportTicket:vi.fn()}));
vi.mock('@tanstack/react-router', () => ({Link:({to,children,...props}: {to:string;children:React.ReactNode}) => <a href={to} {...props}>{children}</a>}));
import { SupportHandover } from './support-handover';
import type { PublicSupportChannels } from '@/lib/support-channels';
afterEach(cleanup);
function show(channels:PublicSupportChannels) {
  return render(<SupportHandover lang="en" sessionId="00000000-0000-4000-8000-000000000001" messages={[{role:'user',content:'Please help'}]} channels={channels}/>);
}
describe('handover channel availability', () => {
  it('offers only contact-page navigation when all channels are disabled', () => {
    show({phone:'',whatsapp:'',ticket_enabled:false});
    expect(screen.getAllByRole('link').map(a=>a.getAttribute('href'))).toEqual(['/contact']);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
  it('uses the configured phone destination without enforcing another number', () => {
    show({phone:'920007168',whatsapp:'',ticket_enabled:false});
    expect(screen.getAllByRole('link').map(a=>a.getAttribute('href'))).toEqual(['tel:920007168']);
  });
  it('allows WhatsApp alone', () => {
    show({phone:'',whatsapp:'https://wa.me/966500000000',ticket_enabled:false});
    expect(screen.getAllByRole('link').map(a=>a.getAttribute('href'))).toEqual(['https://wa.me/966500000000']);
  });
  it('collects name phone and subject only when the ticket channel is enabled', () => {
    show({phone:'',whatsapp:'',ticket_enabled:true});
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
    expect(screen.getByRole('checkbox')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/contact');
  });
  it('removes the form and direct links when channels are disabled after opening', () => {
    const view = show({phone:'920007168',whatsapp:'https://wa.me/966500000000',ticket_enabled:true});
    view.rerender(<SupportHandover lang="en" sessionId="00000000-0000-4000-8000-000000000001" messages={[{role:'user',content:'Help'}]} channels={{phone:'',whatsapp:'',ticket_enabled:false}}/>);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getAllByRole('link').map(a=>a.getAttribute('href'))).toEqual(['/contact']);
  });
});