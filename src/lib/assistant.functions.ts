import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { agentSettingsSchema, parseAgentSettings, supportInputSchema } from './assistant-policy';
import { z } from 'zod';
export const getAssistantPublic = createServerFn({method:'GET'}).handler(async () => {
  const {loadAssistantData} = await import('./assistant-data.server');
  const data = await loadAssistantData();
  const {getServerSupabase} = await import('./supabase-server.server');
  const {client} = await getServerSupabase();
  const stations = client ? await client.from('stations').select('name_ar,name_en,city_ar,city_en,district_ar,district_en,services,is_active,status').order('name_en').limit(1000) : null;
  return {quick_actions:data.settings.quick_actions,faqs:data.faqs,whatsapp:data.whatsapp,stations:stations?.data ?? []};
});
export const getAgentSettings = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const {data,error} = await context.supabase.from('site_settings').select('value').eq('key','ai_agent').maybeSingle();
  if (error) throw new Error('Unable to load assistant settings');
  return parseAgentSettings(data?.value);
});
export const saveAgentSettings = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((raw:unknown)=>agentSettingsSchema.parse(raw)).handler(async ({data,context})=>{
  const {error} = await context.supabase.from('site_settings').upsert({key:'ai_agent',value:data});
  if (error) throw new Error('Unable to save assistant settings');
  return {ok:true};
});
export const submitSupportTicket = createServerFn({method:'POST'}).inputValidator((raw:unknown)=>supportInputSchema.parse(raw)).handler(async ({data})=>{
  const {getAdminClientOrNull} = await import('./supabase-server.server');
  const {checkPersistentRate,extractIp,hashIp,messageLooksAbusive} = await import('./chat.abuse');
  const db = await getAdminClientOrNull();
  if (!db) return {ok:false as const};
  if (messageLooksAbusive(data.subject) || data.transcript.some(m => messageLooksAbusive(m.content))) return {ok:false as const};
  const ip = await hashIp(extractIp(getRequest().headers));
  const limit = await checkPersistentRate(db,`support:${ip || data.sessionId}`,3600,10);
  if (!limit.allowed) return {ok:false as const};
  const {data:ticket,error} = await db.from('support_tickets').insert({full_name:data.full_name,contact:data.phone,issue:data.subject,session_id:data.sessionId,transcript:data.transcript,status:'new',handoff_requested:true}).select('id,reference').single();
  if (error || !ticket) return {ok:false as const};
  // A caller-supplied session ID does not authorize changing another conversation.
  // The bounded transcript snapshot is the complete attachment for this ticket.
  return {ok:true as const,reference:ticket.reference};
});
export const supportTicketsQuery = { queryKey:['admin','support-tickets'], queryFn:()=>listSupportTickets() };
export const listSupportTickets = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
  const {data,error} = await context.supabase.from('support_tickets').select('*').order('created_at',{ascending:false}).limit(500);
  if(error) throw new Error('Unable to load support tickets');
  return data ?? [];
});
export const updateSupportTicket = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((raw:unknown)=>z.object({id:z.string().uuid(),status:z.enum(['new','reviewing','closed']),internal_notes:z.string().max(8000)}).parse(raw)).handler(async ({data,context})=>{
  const {error,data:updated} = await context.supabase.from('support_tickets').update({status:data.status,internal_notes:data.internal_notes}).eq('id',data.id).select('id').single();
  if(error || !updated) throw new Error('Unable to update support ticket');
  return {ok:true};
});
