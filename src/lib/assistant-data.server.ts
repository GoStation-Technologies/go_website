import { getServerSupabase } from './supabase-server.server';
import { parseAgentSettings } from './assistant-policy';
import { resolveSupportChannels } from './support-channels';
export async function loadAssistantData() {
  const {client} = await getServerSupabase();
  if (!client) return {settings:parseAgentSettings(null),faqs:[],channels:resolveSupportChannels(null)};
  const [settings,faqs] = await Promise.all([
    client.from('site_settings').select('value').eq('key','ai_agent').maybeSingle(),
    client.from('faqs').select('question_ar,question_en,answer_ar,answer_en,status').eq('status','published').order('sort_order'),
  ]);
  const parsed = parseAgentSettings(settings.data?.value);
  return {settings:parsed,faqs:faqs.data ?? [],channels:resolveSupportChannels(parsed.channels)};
}
