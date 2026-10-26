import { z } from 'zod';
import { normalizeSearch } from './chat-fallback';
import { supportChannelsSchema } from './support-channels';
export const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(6000) });
export const agentSettingsSchema = z.object({
  prompt_ar: z.string().max(8000).default(''), prompt_en: z.string().max(8000).default(''),
  quick_actions: z.array(z.object({ ar: z.string().trim().min(1).max(100), en: z.string().trim().min(1).max(100) })).max(12),
  escalation_keywords: z.array(z.string().trim().min(1).max(100)).max(60),
  channels: supportChannelsSchema.default(() => supportChannelsSchema.parse({})),
});
export const defaultAgentSettings = agentSettingsSchema.parse({
  quick_actions: [{ar:'أقرب محطة',en:'Nearest station'},{ar:'الامتياز التجاري',en:'Franchise'},{ar:'الاستفسار عن وظيفة',en:'Careers'},{ar:'التحدث مع موظف',en:'Speak to a person'}],
  escalation_keywords: ['شكوى','مشكلة','مدير','موظف بشري','احتيال','التحدث مع موظف','complaint','problem','manager','human','fraud','speak to a person'],
});
export type AgentSettings = z.infer<typeof agentSettingsSchema>;
export function parseAgentSettings(value: unknown): AgentSettings { const parsed = agentSettingsSchema.safeParse(value); return parsed.success ? parsed.data : defaultAgentSettings; }
export type PublishedFaq = { question_ar: string; question_en: string; answer_ar: string; answer_en: string; status: string };
const stop = new Set(['هل','ما','هي','هو','كيف','اين','عن','في','من','the','a','is','are','what','how','where','do','i','can','you','to','of']);
export function matchPublishedFaq(message: string, rows: PublishedFaq[], lang: 'ar'|'en') {
  const query = normalizeSearch(message);
  const terms = [...new Set(query.split(' ').filter(t => t.length > 1 && !stop.has(t)))];
  let best: {score:number;answer:string}|undefined;
  for (const row of rows) {
    if (row.status !== 'published') continue;
    const answer = lang === 'ar' ? row.answer_ar : row.answer_en;
    if (!answer?.trim()) continue;
    for (const question of [row.question_ar,row.question_en]) {
      const normalized = normalizeSearch(question);
      const words = new Set(normalized.split(' ').filter(t => t.length > 1 && !stop.has(t)));
      const overlap = terms.filter(t => words.has(t)).length;
      const score = query === normalized ? 1 : terms.length && overlap >= Math.min(2,terms.length) ? overlap / Math.max(terms.length,words.size) : 0;
      if (score >= 0.6 && (!best || score > best.score)) best = {score,answer};
    }
  }
  return best?.answer ?? null;
}
export function requestsHuman(message: string, keywords: string[]) {
  const q = ` ${normalizeSearch(message)} `;
  return [...defaultAgentSettings.escalation_keywords,...keywords].some(k => q.includes(` ${normalizeSearch(k)} `));
}
export function mustEscalate(attempts: number, failed: boolean, human: boolean) { return human || failed || attempts >= 2; }
export function officialWhatsapp(value: unknown) {
  return normalizeWhatsapp(value);
}
export const supportInputSchema = z.object({sessionId:z.string().uuid(),full_name:z.string().trim().min(2).max(150),phone:z.string().trim().regex(/^\+?[\d\s()-]{8,20}$/),subject:z.string().trim().min(3).max(500),transcript:z.array(messageSchema).min(1).max(200)});
export function handoverReply(lang:'ar'|'en') { return lang === 'ar' ? 'يسعد فريق خدمة العملاء مساعدتك. تواصل معنا عبر الخيارات المتاحة أدناه أو صفحة التواصل /contact.' : 'Our customer-service team can help. Use the available options below or visit /contact.'; }
