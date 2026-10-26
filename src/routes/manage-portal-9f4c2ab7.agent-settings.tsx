import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getAgentSettings, saveAgentSettings } from '@/lib/assistant.functions';
import { agentSettingsSchema } from '@/lib/assistant-policy';
import { Switch } from '@/components/ui/switch';
const options = {queryKey:['admin','agent-settings'],queryFn:()=>getAgentSettings()};
export const Route = createFileRoute('/manage-portal-9f4c2ab7/agent-settings')({
 loader:({context})=>context.queryClient.ensureQueryData(options), component:AgentSettings,
 head:()=>({meta:[{title:'Assistant controls — GoStation'},{name:'description',content:'Manage GoStation assistant guidance, quick replies and escalation.'},{property:'og:title',content:'GoStation assistant controls'},{property:'og:description',content:'Staff controls for customer support.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),
});
function AgentSettings() {
 const {i18n} = useTranslation(); const ar = i18n.language.startsWith('ar');
 const {data} = useSuspenseQuery(options); const [draft,setDraft]=useState(data); const [busy,setBusy]=useState(false); const qc=useQueryClient(); const save=useServerFn(saveAgentSettings);
 const onSave=async()=>{ const parsed=agentSettingsSchema.safeParse(draft); if(!parsed.success){toast.error(ar?'تحقق من النصوص ورقم الهاتف ورابط واتساب.':'Check the required text, phone number and WhatsApp link.');return;} setBusy(true); try{await save({data:parsed.data});await Promise.all([qc.invalidateQueries({queryKey:options.queryKey}),qc.invalidateQueries({queryKey:['cms','assistant-public']})]);toast.success(ar?'تم حفظ الإعدادات':'Settings saved');}catch{toast.error(ar?'تعذر الحفظ. تحقق من صلاحية تعديل المحتوى.':'Unable to save. Content-editing permission is required.');}finally{setBusy(false);} };
 return <div className="max-w-4xl space-y-8">
 <h1 className="text-2xl font-semibold">{ar?'إعدادات المساعد الذكي':'AI Agent Settings'}</h1>
 <section className="space-y-5 border-b pb-6">
 <h2 className="text-lg font-semibold">{ar?'قنوات خدمة العملاء':'Customer-service channels'}</h2>
 <label className="flex items-center justify-between gap-4 text-sm"><span>{ar?'تفعيل الاتصال المباشر':'Enable Call Center Phone'}</span><Switch checked={draft.channels.phone_enabled} onCheckedChange={phone_enabled=>setDraft({...draft,channels:{...draft.channels,phone_enabled}})}/></label>
 <label className="block space-y-2 text-sm"><span>{ar?'رقم الهاتف':'Phone number'}</span><Input type="tel" dir="ltr" maxLength={24} placeholder="920007168" value={draft.channels.phone} onChange={e=>setDraft({...draft,channels:{...draft.channels,phone:e.target.value}})}/></label>
 <label className="flex items-center justify-between gap-4 text-sm"><span>{ar?'تفعيل واتساب الدعم':'Enable WhatsApp Support'}</span><Switch checked={draft.channels.whatsapp_enabled} onCheckedChange={whatsapp_enabled=>setDraft({...draft,channels:{...draft.channels,whatsapp_enabled}})}/></label>
 <label className="block space-y-2 text-sm"><span>{ar?'رقم واتساب الدولي أو رابط المحادثة المباشر':'International WhatsApp number or direct chat link'}</span><Input dir="ltr" maxLength={500} placeholder="https://wa.me/966…" value={draft.channels.whatsapp} onChange={e=>setDraft({...draft,channels:{...draft.channels,whatsapp:e.target.value}})}/></label>
 <label className="flex items-center justify-between gap-4 text-sm"><span>{ar?'تفعيل نموذج طلب الدعم':'Enable In-Chat Ticket Submission Form'}</span><Switch checked={draft.channels.ticket_enabled} onCheckedChange={ticket_enabled=>setDraft({...draft,channels:{...draft.channels,ticket_enabled}})}/></label>
 </section>
 <section className="space-y-4 border-b pb-6"><h2 className="text-lg font-semibold">{ar?'الشخصية والتعليمات وسياسة الشركة':'Persona, guidance & company policy'}</h2>
 {(['ar','en'] as const).map(lang=><label className="block space-y-2 text-sm" key={lang}><span>{lang==='ar'?'التعليمات العربية':'English instructions'}</span><Textarea rows={7} dir={lang==='ar'?'rtl':'ltr'} maxLength={8000} value={draft[`prompt_${lang}`]} onChange={e=>setDraft({...draft,[`prompt_${lang}`]:e.target.value})}/></label>)}
 </section>
 <section className="space-y-4 border-b pb-6"><h2 className="text-lg font-semibold">{ar?'الردود السريعة':'Quick actions'}</h2>
 {draft.quick_actions.map((action,index)=><div key={index} className="flex items-center gap-2"><Input aria-label={ar?'النص العربي':'Arabic text'} dir="rtl" maxLength={100} value={action.ar} onChange={e=>setDraft({...draft,quick_actions:draft.quick_actions.map((a,i)=>i===index?{...a,ar:e.target.value}:a)})}/><Input aria-label={ar?'النص الإنجليزي':'English text'} dir="ltr" maxLength={100} value={action.en} onChange={e=>setDraft({...draft,quick_actions:draft.quick_actions.map((a,i)=>i===index?{...a,en:e.target.value}:a)})}/><Button variant="ghost" size="icon" aria-label={ar?'حذف':'Remove'} onClick={()=>setDraft({...draft,quick_actions:draft.quick_actions.filter((_,i)=>i!==index)})}><Trash2 className="h-4 w-4"/></Button></div>)}
 <Button variant="outline" disabled={draft.quick_actions.length>=12} onClick={()=>setDraft({...draft,quick_actions:[...draft.quick_actions,{ar:'',en:''}]})}><Plus className="h-4 w-4"/>{ar?'إضافة رد سريع':'Add quick action'}</Button>
 </section>
 <section className="space-y-3"><h2 className="text-lg font-semibold">{ar?'عبارات التصعيد':'Escalation phrases'}</h2>
 <Textarea aria-label={ar?'عبارات التصعيد، عبارة في كل سطر':'Escalation phrases, one per line'} rows={7} value={draft.escalation_keywords.join('\n')} onChange={e=>setDraft({...draft,escalation_keywords:e.target.value.split('\n')})}/></section>
 <Button onClick={onSave} disabled={busy}><Save className="h-4 w-4"/>{ar?'حفظ الإعدادات':'Save settings'}</Button>
 </div>;
}
