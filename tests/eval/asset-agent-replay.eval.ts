import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import { hasExplicitResponsibilityGap, INSUFFICIENT_EVIDENCE_ANSWER } from "@/lib/agent/answer-policy";
import { assetQuestionAnswerSchema } from "@/lib/contracts";
import { assetAgentQuestions } from "./asset-agent-questions";
import { gradeAssetAnswer } from "./asset-agent-grader";
// Reclassificação pura das respostas guardadas, sem nova consulta ao modelo/DB.
it.runIf(process.env.ASSET_EVAL_REPLAY === "true")("reaplica a regra de recusa às cinquenta respostas preservadas", () => {
 const raw = JSON.parse(readFileSync("docs/evidencias/avaliacao-agente-2026-10-20-v3.json", "utf8"));
 expect(raw.complete).toBe(true); expect(raw.results).toHaveLength(50);
 const results = raw.results.map((row: {id:string;status:string;answer:string;sources:string[];ok:boolean}) => {
  const question = assetAgentQuestions.find(item=>item.id===row.id); if (!question) throw new Error("Pergunta fora do conjunto");
  const reclassified = row.status === "answered" && hasExplicitResponsibilityGap(question.question,row.answer);
  const answer = assetQuestionAnswerSchema.parse({auditId:null,status:reclassified?"insufficient_evidence":row.status,answer:reclassified?INSUFFICIENT_EVIDENCE_ANSWER:row.answer,confidence:reclassified?"insuficiente":"media",citations:reclassified?[]:row.sources.map(title=>({chunkId:"fixture",assetId:"fixture",versionId:"fixture",assetType:"sop",title,section:"Fonte fictícia registrada",versionNumber:"1",publishedAt:"2026-10-20T12:00:00Z",href:"/fixture"}))});
  return {id:row.id,ok:gradeAssetAnswer(question,answer),reclassified,status:answer.status,answer:answer.answer,sources:answer.citations.map(item=>item.title)};
 });
 const report={source:"avaliacao-agente-2026-10-20-v3.json",newModelRun:false,newDatabaseRun:false,deterministicReplay:true,total:results.length,passed:results.filter((item:{ok:boolean})=>item.ok).length,results};
 writeFileSync("docs/evidencias/avaliacao-agente-2026-10-20-v3-replay.json",JSON.stringify(report,null,2)+"\n");
 expect(results.find((row:{id:string})=>row.id==="amb-04")).toMatchObject({ok:true,status:"insufficient_evidence",reclassified:true});
 expect(results.filter((row:{reclassified:boolean})=>row.reclassified).map((row:{id:string})=>row.id)).toEqual(["amb-04"]);
});
