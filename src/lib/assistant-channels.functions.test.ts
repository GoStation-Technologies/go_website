import { describe, expect, it, vi } from 'vitest';
const { loadData, getDb } = vi.hoisted(() => ({
  loadData:vi.fn(async () => ({channels:{phone:'',whatsapp:'',ticket_enabled:false}})),
  getDb:vi.fn(),
}));
vi.mock('@tanstack/react-start', () => ({createServerFn:() => {
  const builder = {middleware:()=>builder,inputValidator:()=>builder,handler:(fn:unknown)=>fn};
  return builder;
}}));
vi.mock('@/integrations/supabase/auth-middleware',()=>({requireSupabaseAuth:{}}));
vi.mock('@tanstack/react-start/server',()=>({getRequest:()=>({headers:new Headers()})}));
vi.mock('./assistant-data.server',()=>({loadAssistantData:loadData}));
vi.mock('./supabase-server.server',()=>({getAdminClientOrNull:getDb}));
import { submitSupportTicket } from './assistant.functions';
describe('disabled ticket submission',()=>{
  it('rejects a direct request while the in-chat form is disabled before opening the database',async()=>{
    const handler=submitSupportTicket as unknown as (input:{data:unknown})=>Promise<{ok:boolean}>;
    const result=await handler({data:{sessionId:'00000000-0000-4000-8000-000000000001',full_name:'Test Customer',phone:'0500000000',subject:'Support request',transcript:[{role:'user',content:'Help'}]}});
    expect(result).toEqual({ok:false});
    expect(getDb).not.toHaveBeenCalled();
  });
});