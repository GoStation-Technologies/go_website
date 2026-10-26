import { describe, expect, it, vi } from "vitest";
import { requestChatReply } from "./chat-provider.server";
const ai = {name:"gemini",model:"gemini-3.8-flash",url:"https://example.test/generate",key:"test-only"};
describe("chat provider recovery", () => {
  it.each([401,402,429,500,503])("falls back after %s without retry", async status => {
    const call = vi.fn().mockResolvedValue(new Response(null,{status}));
    expect(await requestChatReply(ai,"system",[],"hello",call)).toEqual({kind:"fallback"});
    expect(call).toHaveBeenCalledTimes(1);
  });
  it("handles network failure", async () => {
    expect(await requestChatReply(ai,"system",[],"hello",vi.fn().mockRejectedValue(new Error("offline")))).toEqual({kind:"fallback"});
  });
  it('bounds unavailable AI requests and sends the full conversation', async () => {
    const call = vi.fn().mockResolvedValue(new Response(null,{status:503}));
    await requestChatReply(ai,'system',[{role:'user',content:'first'},{role:'assistant',content:'reply'}],'next',call);
    const init = call.mock.calls[0]?.[1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body).contents.map((m:{parts:{text:string}[]})=>m.parts[0]?.text)).toEqual(['first','reply','next']);
  });
  it("never makes a paid call with no Gemini key", async () => {
    const call=vi.fn();
    expect(await requestChatReply(null,"system",[],"hello",call)).toEqual({kind:"fallback"});
    expect(call).not.toHaveBeenCalled();
  });
  it("ends access denials and safety refusals", async () => {
    expect(await requestChatReply(ai,"system",[],"hello",vi.fn().mockResolvedValue(new Response(null,{status:403})))).toEqual({kind:"denied"});
    expect(await requestChatReply(ai,"system",[],"hello",vi.fn().mockResolvedValue(Response.json({candidates:[{finishReason:"SAFETY"}]})))).toEqual({kind:"denied"});
  });
});