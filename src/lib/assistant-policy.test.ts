import { describe,it,expect } from 'vitest';
import { matchPublishedFaq,mustEscalate,requestsHuman,defaultAgentSettings,officialWhatsapp,supportInputSchema } from './assistant-policy';
const faq={question_ar:'كيف أقدم طلب امتياز تجاري؟',question_en:'How do I apply for a franchise?',answer_ar:'قدم طلبك المعتمد عبر /franchise',answer_en:'Apply at /franchise',status:'published'};
describe('assistant knowledge and handover policy',()=>{
 it('returns published Arabic curated answer',()=>expect(matchPublishedFaq(faq.question_ar,[faq],'ar')).toBe('قدم طلبك المعتمد عبر /franchise'));
 it('matches English keywords and returns requested language',()=>expect(matchPublishedFaq('apply for franchise',[faq],'ar')).toBe(faq.answer_ar));
 it('never returns draft answers',()=>expect(matchPublishedFaq(faq.question_en,[{...faq,status:'draft'}],'en')).toBeNull());
 it('does not match unrelated questions',()=>expect(matchPublishedFaq('coffee in Jeddah',[faq],'en')).toBeNull());
 it('escalates complaints immediately',()=>expect(requestsHuman('لدي شكوى',defaultAgentSettings.escalation_keywords)).toBe(true));
 it('recognizes custom escalation phrases',()=>expect(requestsHuman('report damaged pump',['damaged pump'])).toBe(true));
 it('waits through first unresolved attempt',()=>expect(mustEscalate(1,false,false)).toBe(false));
 it('hands over at second unresolved attempt',()=>expect(mustEscalate(2,false,false)).toBe(true));
 it('hands over immediately on recoverable failure',()=>expect(mustEscalate(0,true,false)).toBe(true));
 it('hands over explicit human request immediately',()=>expect(mustEscalate(0,false,true)).toBe(true));
 it('only accepts official WhatsApp URLs',()=>{expect(officialWhatsapp('https://wa.me/966500000000')).toBe('https://wa.me/966500000000');expect(officialWhatsapp('https://malicious.example')).toBe('');});
 it('requires name phone subject and conversation',()=>{const input={sessionId:'00000000-0000-4000-8000-000000000001',full_name:'Test Customer',phone:'0500000000',subject:'Service help',transcript:[{role:'user',content:'help'}]};expect(supportInputSchema.safeParse(input).success).toBe(true);expect(supportInputSchema.safeParse({...input,phone:'bad'}).success).toBe(false);expect(supportInputSchema.safeParse({...input,transcript:[]}).success).toBe(false);});
});
