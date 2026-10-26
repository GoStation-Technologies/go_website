import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Phone, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitSupportTicket } from '@/lib/assistant.functions';
import { supportInputSchema, type messageSchema } from '@/lib/assistant-policy';
import type { z } from 'zod';
import { Link } from '@tanstack/react-router';
import type { PublicSupportChannels } from '@/lib/support-channels';
export function SupportHandover({lang,sessionId,messages,channels,handoverEventId}:{lang:'ar'|'en';sessionId:string;messages:z.infer<typeof messageSchema>[];channels:PublicSupportChannels;handoverEventId?:string}) {
  const ar = lang === 'ar';
  const submit = useServerFn(submitSupportTicket);
  const [busy,setBusy] = useState(false);
  const [reference,setReference] = useState('');
  const [error,setError] = useState('');
  const [draft,setDraft] = useState({full_name:'',phone:'',subject:''});
  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!channels.ticket_enabled) return;
    const parsed = supportInputSchema.safeParse({...draft,sessionId,handoverEventId,transcript:messages});
    if(!parsed.success) {setError(ar?'يرجى إدخال الاسم ورقم هاتف صحيح وموضوع الطلب.':'Please enter your name, a valid phone number and subject.');return;}
    setBusy(true);
    try { const result = await submit({data:parsed.data}); if(result.ok) {setReference(result.reference);} else setError(ar?'لم يتم إرسال الطلب. يرجى المحاولة مجدداً أو زيارة صفحة التواصل.':'Your request was not sent. Please retry or visit our contact page.'); }
    catch {setError(ar?'تعذر الاتصال. احتفظ بطلبك وحاول مجدداً أو زر صفحة التواصل.':'Unable to connect. Your details are kept; retry or visit our contact page.');}
    finally {setBusy(false);}
  };
  return <section className="rounded-lg border border-accent/40 bg-background p-3 space-y-3" aria-label={ar?'تحويل لخدمة العملاء':'Customer-service handover'}>
    <h3 className="text-sm font-semibold">{ar?'خدمة العملاء':'Customer service'}</h3>
    {(channels.phone || channels.whatsapp) ? <div className="flex flex-wrap gap-2">
      {channels.phone && <Button asChild size="sm" variant="outline"><a href={`tel:${channels.phone}`}><Phone className="h-4 w-4"/><span dir="ltr">{channels.phone}</span></a></Button>}
      {channels.whatsapp && <Button asChild size="sm" variant="outline"><a href={channels.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4"/>{ar?'واتساب':'WhatsApp'}</a></Button>}
    </div> : <p className="text-sm">{ar?'يمكنك التواصل مع فريقنا عبر ':'You can reach our team through our '}<Link to="/contact" className="underline underline-offset-2">{ar?'صفحة التواصل':'contact page'}</Link>.</p>}
    {reference && <p role="status" className="text-sm">{ar?'تم إرسال طلبك. الرقم المرجعي:':'Request sent. Reference:'} <b dir="ltr">{reference}</b></p>}
    {channels.ticket_enabled && !reference && <form onSubmit={onSubmit} className="space-y-2">
      {(['full_name','phone','subject'] as const).map((key,i)=><label className="block text-xs space-y-1" key={key}><span>{(ar?['الاسم الكامل','رقم الهاتف','موضوع الطلب']:['Full name','Phone number','Subject'])[i]}</span><Input required value={draft[key]} maxLength={key==='subject'?500:key==='phone'?20:150} type={key==='phone'?'tel':'text'} dir={key==='phone'?'ltr':undefined} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
      <label className="flex gap-2 text-xs"><input type="checkbox" required/>{ar?'أوافق على إرسال بياناتي وهذه المحادثة لفريق خدمة العملاء.':'I agree to share my details and this conversation with customer service.'}</label>
      <Button size="sm" type="submit" disabled={busy}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:null}{ar?'إرسال الطلب':'Submit request'}</Button>
    </form>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}
