import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { listSupportTickets, updateSupportTicket, supportTicketsQuery, unresolvedQuestionsQuery, reviewUnresolvedQuestion } from '@/lib/assistant.functions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { messageSchema } from '@/lib/assistant-policy';
export const Route = createFileRoute('/manage-portal-9f4c2ab7/support-tickets')({
 loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(supportTicketsQuery),context.queryClient.ensureQueryData(unresolvedQuestionsQuery)]);},component:SupportTickets,
 head:()=>({meta:[{title:'Support tickets — GoStation'},{name:'description',content:'Follow up GoStation customer-service tickets and conversations.'},{property:'og:title',content:'GoStation support tickets'},{property:'og:description',content:'Customer-service follow-up for staff.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),
});
function SupportTickets(){
 const {data}=useSuspenseQuery(supportTicketsQuery); const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const [search,setSearch]=useState('');const [status,setStatus]=useState('all');
 return <div className="space-y-5"><h1 className="text-2xl font-semibold">{ar?'طلبات الدعم والمحادثات':'Support tickets & conversations'}</h1>
 <Tabs defaultValue="tickets"><TabsList><TabsTrigger value="tickets">{ar?'طلبات الدعم':'Support tickets'}</TabsTrigger><TabsTrigger value="unresolved">{ar?'الأسئلة غير المجابة':'Unresolved Questions'}</TabsTrigger></TabsList><TabsContent value="tickets" className="space-y-5">
 <div className="flex flex-wrap gap-3"><Input className="max-w-sm" placeholder={ar?'بحث بالاسم أو الموضوع أو الرقم المرجعي':'Search name, subject or reference'} value={search} onChange={e=>setSearch(e.target.value)}/><select className="rounded-md border bg-background p-2 text-sm" aria-label={ar?'حالة الطلب':'Ticket status'} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">{ar?'جميع الحالات':'All statuses'}</option><option value="new">{ar?'جديد':'New ticket'}</option><option value="reviewing">{ar?'قيد المتابعة':'In progress'}</option><option value="closed">{ar?'مغلق':'Closed'}</option></select></div>
 {!data.length && <p className="text-muted-foreground">{ar?'لا توجد طلبات دعم.':'No support tickets.'}</p>}
 {data.filter(row=>(status==='all'||row.status===status)&&`${row.full_name} ${row.contact} ${row.issue} ${row.reference}`.toLowerCase().includes(search.toLowerCase())).map(row=><Ticket key={row.id} row={row} ar={ar}/>)}
 </TabsContent><TabsContent value="unresolved"><UnresolvedQuestions ar={ar}/></TabsContent></Tabs></div>;
}
function UnresolvedQuestions({ar}:{ar:boolean}) {
 const {data}=useSuspenseQuery(unresolvedQuestionsQuery);const review=useServerFn(reviewUnresolvedQuestion);const qc=useQueryClient();const [busy,setBusy]=useState<string>();
 const onReview=async(id:string)=>{setBusy(id);try{await review({data:{id}});await qc.invalidateQueries({queryKey:unresolvedQuestionsQuery.queryKey});}catch{toast.error(ar?'تعذر الحفظ':'Unable to save');}finally{setBusy(undefined);}};
 return <div className="divide-y">{!data.length&&<p className="py-4 text-muted-foreground">{ar?'لا توجد أسئلة غير مجابة.':'No unanswered questions.'}</p>}{data.map(row=><div key={row.id} className="space-y-3 py-4"><p className="whitespace-pre-wrap break-words" dir={row.language==='ar'?'rtl':'ltr'}>{row.question}</p><div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><time>{new Date(row.created_at).toLocaleString(ar?'ar-SA':'en-GB')}</time>{row.status==='reviewed'?<span>{ar?'تمت المراجعة':'Reviewed'}</span>:<Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={()=>void onReview(row.id)}>{ar?'تمت المراجعة':'Mark reviewed'}</Button>}</div></div>)}</div>;
}
function Ticket({row,ar}:{row:Awaited<ReturnType<typeof listSupportTickets>>[number];ar:boolean}){
 const [status,setStatus]=useState(row.status);const [notes,setNotes]=useState(row.internal_notes??'');const [busy,setBusy]=useState(false);const save=useServerFn(updateSupportTicket);const qc=useQueryClient();
 const transcript=messageSchema.array().safeParse(row.transcript);
 const onSave=async()=>{if(!['new','reviewing','closed'].includes(status))return;setBusy(true);try{await save({data:{id:row.id,status:status as 'new'|'reviewing'|'closed',internal_notes:notes}});await qc.invalidateQueries({queryKey:supportTicketsQuery.queryKey});toast.success(ar?'تم الحفظ':'Saved');}catch{toast.error(ar?'تعذر الحفظ':'Unable to save');}finally{setBusy(false);}};
 return <details className="rounded-lg border p-4"><summary className="cursor-pointer flex flex-wrap gap-3 text-sm"><b dir="ltr">{row.reference}</b><span>{row.full_name}</span>{row.priority==='priority'&&<strong className="text-destructive">{ar?'عاجل':'Priority'}</strong>}<span className="text-muted-foreground">{row.status==='new'?(ar?'جديد':'New ticket'):row.status==='reviewing'?(ar?'قيد المتابعة':'In progress'):(ar?'مغلق':'Closed')}</span></summary><div className="mt-4 space-y-4 text-sm"><p dir="ltr">{row.contact}</p><p>{row.issue}</p><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString(ar?'ar-SA':'en-GB')}</p>
 <div className="space-y-2 border-y py-3">{transcript.success?transcript.data.map((m,i)=><div key={i} className="whitespace-pre-wrap"><b>{m.role==='user'?(ar?'العميل':'Customer'):(ar?'المساعد':'Assistant')}: </b>{m.content}</div>):null}</div>
 <label className="block space-y-2"><span>{ar?'الحالة':'Status'}</span><select className="block rounded-md border bg-background p-2" value={status} onChange={e=>setStatus(e.target.value)}><option value="new">{ar?'جديد':'New ticket'}</option><option value="reviewing">{ar?'قيد المتابعة':'In progress'}</option><option value="closed">{ar?'مغلق':'Closed'}</option></select></label>
 <label className="block space-y-2"><span>{ar?'ملاحظات داخلية':'Internal notes'}</span><Textarea value={notes} maxLength={8000} onChange={e=>setNotes(e.target.value)}/></label><Button size="sm" disabled={busy} onClick={onSave}>{ar?'حفظ':'Save'}</Button>
 </div></details>;
}
