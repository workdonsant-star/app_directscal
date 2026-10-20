import { describe, expect, it, vi } from "vitest";
import { buildUsagePopulation, readAllUsageRows } from "@/lib/data/process-usage-population";
import { buildProcessUsageAnalytics } from "@/lib/data/process-usage-analytics";
describe("população elegível de consulta",()=>{
 it("inclui liderança exclusivamente Slack e não duplica referências de dois setores",()=>{
  const population=buildUsagePopulation([{key:"setor-a",slackIdentity:"T1:U1"},{key:"setor-b",slackIdentity:"T1:U1"}]);
  expect(population.size).toBe(1);expect(population.resolveAsker(null,"T1:U1")).toBe(population.resolveAsker(null,"T1:U1"));
  expect(population.resolveAsker(null,"T2:U1")).toBeNull();
 });
 it("concilia cadastros internos por email e ID, sem usar nome",()=>{
  const population=buildUsagePopulation([{key:"pessoa",appUserId:"u1",email:" PESSOA@example.com "},{key:"time",email:"pessoa@example.com"}]);
  expect(population.size).toBe(1);expect(population.resolveAsker("u1",null)).not.toBeNull();
  expect(population.resolveAsker("u2",null)).toBeNull();
 });
 it("não inventa população única entre canais ainda não verificados",()=>{
  const people=[{key:"app",appUserId:"u1",email:"a@example.com"},{key:"slack",slackIdentity:"T1:U1"}];
  expect(buildUsagePopulation(people)).toMatchObject({size:null,unresolved:true});
  const linked=buildUsagePopulation(people,[{appUserId:"u1",slackIdentity:"T1:U1"}]);
  expect(linked.size).toBe(1);expect(linked.resolveAsker("u1",null)).toBe(linked.resolveAsker(null,"T1:U1"));
 });
 it("lê todas as páginas e interrompe em erro, sem base parcial silenciosa",async()=>{
  const read=vi.fn().mockResolvedValueOnce({data:[1,2],error:null}).mockResolvedValueOnce({data:[3],error:null});
  expect(await readAllUsageRows(read,2)).toEqual([1,2,3]);expect(read.mock.calls).toEqual([[0,1],[2,3]]);
  await expect(readAllUsageRows(vi.fn().mockResolvedValue({data:null,error:new Error("falha")}))).rejects.toThrow("falha");
 });
 it("expõe o período e suprime só a adoção quando identidade não está conciliada",()=>{
  const analytics=buildProcessUsageAnalytics({audits:[{id:"a",createdAt:"2026-10-18T12:00:00Z",status:"respondida",askerKey:"pessoa",citations:[]}],feedback:[],teamSize:null,adoptionUnavailableReason:"Identidades pendentes",now:new Date("2026-10-19T12:00:00Z")});
  expect(analytics.adoption.value).toBeNull();expect(analytics.adoption.detail).toBe("Identidades pendentes");
  expect(analytics.coverage.value).toBe(100);expect(analytics.period).toMatchObject({end:"2026-10-19T12:00:00.000Z",start:"2026-09-19T12:00:00.000Z"});
 });
});
