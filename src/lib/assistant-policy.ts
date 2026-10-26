import { z } from 'zod';
import { normalizeSearch } from './chat-fallback';
import { supportChannelsSchema, normalizeWhatsapp } from './support-channels';
import type { PublicSupportChannels } from './support-channels';
export const automatedActionsSchema = z.object({
  complaints_enabled: z.boolean().default(true),
  misses_enabled: z.boolean().default(true),
  default_action: z.enum(['phone','whatsapp','ticket','all']).default('all'),
});
export const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(6000) });
export const agentSettingsSchema = z.object({
  prompt_ar: z.string().max(8000).default(''), prompt_en: z.string().max(8000).default(''),
  quick_actions: z.array(z.object({ ar: z.string().trim().min(1).max(100), en: z.string().trim().min(1).max(100) })).max(12),
  escalation_keywords: z.array(z.string().trim().min(1).max(100)).max(60),
  channels: supportChannelsSchema.default(() => supportChannelsSchema.parse({})),
  actions: automatedActionsSchema.default(() => automatedActionsSchema.parse({})),
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
export type HandoverReason = 'complaint'|'human'|'misses'|'failure';
export function complaintMatches(message:string, settings:AgentSettings) {
  return settings.actions.complaints_enabled && requestsHuman(message, settings.escalation_keywords)
    && !explicitHuman(message);
}
export function explicitHuman(message:string) {
  const query = normalizeSearch(message);
  return ['التحدث مع موظف','موظف بشري','تواصل مع موظف','اكلم موظف','speak to a person','talk to a person','speak to an agent','human','manager','مدير'].some(k => (` ${query} `).includes(` ${normalizeSearch(k)} `));
}
export function actionReply(reason:HandoverReason,lang:'ar'|'en') {
  if(reason==='complaint') return lang==='ar'?'نعتذر عن أي تجربة غير مرضية. تم تحويلك مباشرة لقنوات المساعدة المعتمدة:':'We apologize for any unsatisfactory experience. You have been directed to our approved support channels:';
  if(reason==='misses') return lang==='ar'?'لم أتمكن من العثور على إجابة دقيقة لسؤالك. يمكنك التواصل مع فريق الدعم مباشرة لمساعدتك.':'I could not find a precise answer to your question. Please contact our support team directly for help.';
  return handoverReply(lang);
}
export function handoverChannels(channels:PublicSupportChannels,settings:AgentSettings['actions'],reason:HandoverReason):PublicSupportChannels {
  const action=reason==='complaint'?'all':settings.default_action;
  if(action==='all') return channels;
  return {phone:action==='phone'?channels.phone:'',whatsapp:action==='whatsapp'?channels.whatsapp:'',ticket_enabled:action==='ticket'&&channels.ticket_enabled};
}
export function shouldHandoverAfterMiss(attempts:number,settings:AgentSettings) {return settings.actions.misses_enabled && attempts>=2;}
export function businessAction(message:string,lang:'ar'|'en') {
  const query=normalizeSearch(message);
  const services=[
    {words:['تاجير','leasing','lease'],to:'/leasing' as const,ar:'التأجير',en:'Leasing',summary_ar:'يمكنك تقديم طلب تأجير عقار ومشاركة تفاصيل الموقع والمساحة عبر صفحة التأجير.',summary_en:'Submit a property leasing request with the location and area on our leasing page.'},
    {words:['امتياز','franchise'],to:'/franchise' as const,ar:'الامتياز التجاري',en:'Franchise',summary_ar:'يمكنك تقديم طلب الامتياز التجاري ومشاركة بياناتك عبر صفحة الامتياز.',summary_en:'Submit your franchise application and contact details on our franchise page.'},
    {words:['استحواذ','acquisition','acquisitions'],to:'/acquisitions' as const,ar:'الاستحواذ',en:'Acquisitions',summary_ar:'يمكنك تقديم فرصة استحواذ ومشاركة تفاصيلها عبر صفحة الاستحواذ.',summary_en:'Submit an acquisition opportunity and its details on our acquisitions page.'},
  ];
  const item=services.find(s=>s.words.some(w=>query.includes(w)));
  return item?{to:item.to,label:item[lang],reply:lang==='ar'?item.summary_ar:item.summary_en}:null;
}
