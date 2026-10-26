import {describe,it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({load:vi.fn(),db:vi.fn(),insert:vi.fn(),event:vi.fn()}));
vi.mock('@tanstack/react-start',()=>({createServerFn:()=>{const b={middleware:()=>b,inputValidator:()=>b,handler:(fn:unknown)=>fn};return b;}}));
vi.mock('@/integrations/supabase/auth-middleware',()=>({requireSupabaseAuth:{}}));
vi.mock('@tanstack/react-start/server',()=>({getRequest:()=>({headers:new Headers()})}));
vi.mock('./assistant-data.server',()=>({loadAssistantData:mocks.load}));
vi.mock('./supabase-server.server',()=>({getAdminClientOrNull:mocks.db}));
vi.mock('./chat.abuse',()=>({checkPersistentRate:async()=>({allowed:true}),extractIp:()=>'',hashIp:async()=>'',messageLooksAbusive:()=>false}));
import {submitSupportTicket} from './assistant.functions';
const input={sessionId:'00000000-0000-4000-8000-000000000001',handoverEventId:'00000000-0000-4000-8000-000000000002',full_name:'Test Customer',phone:'0500000000',subject:'Support request',transcript:[{role:'user',content:'Help'}]};
const submit=submitSupportTicket as unknown as (args:{data:unknown})=>Promise<unknown>;
beforeEach(()=>{
 vi.clearAllMocks();mocks.load.mockResolvedValue({channels:{ticket_enabled:true}});
 mocks.db.mockResolvedValue({from:(table:string)=>{if(table==='support_tickets')return{insert:(row:unknown)=>{mocks.insert(row);return{select:()=>({single:async()=>({data:{id:'ticket',reference:'GS-TKT-TEST'},error:null})})};}};const chain={select:()=>chain,eq:()=>chain,gte:()=>chain,maybeSingle:mocks.event};return chain;}});
});
describe('server-derived complaint ticket priority',()=>{
 it('tags a verified complaint handover as priority',async()=>{mocks.event.mockResolvedValue({data:{reason:'complaint'}});await submit({data:input});expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({priority:'priority'}));});
 it('keeps a human request normal',async()=>{mocks.event.mockResolvedValue({data:{reason:'human'}});await submit({data:input});expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({priority:'normal'}));});
 it('does not trust visitor-supplied priority',async()=>{mocks.event.mockResolvedValue({data:null});await submit({data:{...input,priority:'priority'}});expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({priority:'normal'}));});
});