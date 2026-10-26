import { getServerSupabase } from './supabase-server.server';
import { parseAgentSettings, officialWhatsapp } from './assistant-policy';
export async function loadAssistantData() {
  const {client} = await getServerSupabase();
  if (!client) return {settings:parseAgentSettings(null),faqs:[],whatsapp:''};
  const [settings,faqs,contact] = await Promise.all([
    client.from('site_settings').select('value').eq('key','ai_agent').maybeSingle(),
    client.from('faqs').select('question_ar,question_en,answer_ar,answer_en,status').eq('status','published').order('sort_order'),
    client.from('site_settings').select('value').eq('key','contact').maybeSingle(),
  ]);
  const details = contact.data?.value as {whatsapp?:unknown}|null;
  return {settings:parseAgentSettings(settings.data?.value),faqs:faqs.data ?? [],whatsapp:officialWhatsapp(details?.whatsapp)};
}
