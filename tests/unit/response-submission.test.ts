import { describe, expect, it, vi } from "vitest";
import { getResponseSubmissionId } from "@/lib/data/response-submission";
const first="00000000-0000-4000-8000-000000000001";
const second="00000000-0000-4000-8000-000000000002";
describe("tentativa anônima de resposta",()=>{
 it("reutiliza a tentativa após falha e recarga sem criar identidade entre links",()=>{
  const values=new Map<string,string>();const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)}};
  const create=vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
  expect(getResponseSubmissionId("link-a",storage,create)).toBe(first);
  expect(getResponseSubmissionId("link-a",storage,create)).toBe(first);
  expect(getResponseSubmissionId("link-b",storage,create)).toBe(second);
  expect(create).toHaveBeenCalledTimes(2);
 });
 it("troca chave malformada e tolera armazenamento indisponível",()=>{
  expect(getResponseSubmissionId("a",{getItem:()=>"inválida",setItem:vi.fn()},()=>first)).toBe(first);
  expect(getResponseSubmissionId("a",{getItem:()=>{throw new Error("negado")},setItem:()=>{throw new Error("negado")}},()=>first)).toBe(first);
 });
});
