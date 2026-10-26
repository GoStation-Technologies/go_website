import {describe,it,expect} from 'vitest';
import {parseAgentSettings,complaintMatches,explicitHuman,shouldHandoverAfterMiss,businessAction,handoverChannels} from './assistant-policy';
const settings=parseAgentSettings(null);
describe('automated assistant action matrix',()=>{
 it('immediately detects complaint triggers',()=>{for(const word of ['شكوى','احتيال','مشكلة'])expect(complaintMatches(`لدي ${word}`,settings)).toBe(true);});
 it('honors the complaint switch',()=>expect(complaintMatches('لدي شكوى',{...settings,actions:{...settings.actions,complaints_enabled:false}})).toBe(false));
 it('separates human requests from complaint priority',()=>{expect(explicitHuman('التحدث مع موظف')).toBe(true);expect(complaintMatches('التحدث مع موظف',settings)).toBe(false);});
 it('hands over on precisely the second miss',()=>{expect(shouldHandoverAfterMiss(1,settings)).toBe(false);expect(shouldHandoverAfterMiss(2,settings)).toBe(true);});
 it('honors the two-miss switch',()=>expect(shouldHandoverAfterMiss(2,{...settings,actions:{...settings.actions,misses_enabled:false}})).toBe(false));
 it('links leasing directly to its page',()=>expect(businessAction('تأجير','ar')?.to).toBe('/leasing'));
 it('links franchise directly to its page',()=>expect(businessAction('امتياز','ar')?.to).toBe('/franchise'));
 it('links acquisition directly to its page',()=>expect(businessAction('استحواذ','ar')?.to).toBe('/acquisitions'));
 it('selects the configured phone action without enabling other channels',()=>expect(handoverChannels({phone:'920007168',whatsapp:'https://wa.me/966500000000',ticket_enabled:true},{...settings.actions,default_action:'phone'},'human')).toEqual({phone:'920007168',whatsapp:'',ticket_enabled:false}));
 it('complaints show every active channel regardless of default selection',()=>expect(handoverChannels({phone:'',whatsapp:'',ticket_enabled:true},{...settings.actions,default_action:'phone'},'complaint')).toEqual({phone:'',whatsapp:'',ticket_enabled:true}));
 it('never enables disabled ticket forms when selected',()=>expect(handoverChannels({phone:'',whatsapp:'',ticket_enabled:false},{...settings.actions,default_action:'ticket'},'human').ticket_enabled).toBe(false));
});