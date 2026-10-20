import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import { generateGroundedAnswer } from "@/lib/agent/answer-providers";
import { getAnswerProviderConfig } from "@/lib/agent/config";
import { resolveGroundedAnswer, selectEvidence } from "@/lib/agent/answer-policy";
import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";
import { legacySopContentToRichText } from "@/lib/data/rich-text";
// Verifica geração/grounding com fontes controladas. Não testa retrieval ou DB.
it.runIf(process.env.ASSET_EVAL_ROLE_CHECK === "true")("responsabilidade explícita prevalece sobre estilo em segunda pessoa", async () => {
 const config = getAnswerProviderConfig(); if (config.provider === "extractive" || !config.model) throw new Error("Configure o provedor do piloto.");
 const cases = [
  {id:"amb-04", template:"sop-onboarding-clientes", question:"Quem é responsável pelo kickoff e pela ata?", expect:"insufficient_evidence", pattern:null},
  {id:"onb-01", template:"sop-onboarding-clientes", question:"Quem coordena o onboarding de um cliente novo?", expect:"answered", pattern:/customer success/i},
  {id:"fin-05", template:"sop-fechamento-financeiro", question:"Quem revisa o fechamento antes da publicação do resumo executivo?", expect:"answered", pattern:/financeir/i},
  {id:"pap-05", template:"sop-geracao-papeis-atribuicoes", question:"Quem é accountable por validar o conteúdo e solicitar ajustes?", expect:"answered", pattern:/l[ií]der/i},
 ];
 const results = [];
 for (const item of cases) {
  const template = managementAssetTemplates.find(template => template.id === item.template)!;
  const assetId=randomUUID(),versionId=randomUUID();
  const chunks = buildManagementAssetChunks({title:template.title!,content:legacySopContentToRichText(template.content)});
  const selected = item.id === "pap-05" ? chunks.filter(chunk => /accountable|l[ií]der|valida/i.test(chunk.content)).slice(0,6) : chunks.slice(0,6);
  const evidence = selectEvidence(selected.map(chunk => ({chunkId:randomUUID(),assetId,versionId,assetType:"sop" as const,title:template.title!,headingPath:chunk.headingPath,content:chunk.content,versionNumber:template.content.version ?? "1",publishedAt:"2026-10-20T12:00:00Z",textRank:1,vectorSimilarity:null,score:1})));
  try {
   const answer=resolveGroundedAnswer(await generateGroundedAnswer(config.provider,config.model,item.question,evidence,[]),evidence,item.question);
   const ok=answer.status===item.expect && (item.pattern ? item.pattern.test(answer.answer) && answer.citations.length>0 : answer.citations.length===0);
   results.push({id:item.id,ok,status:answer.status,answer:answer.answer,sources:answer.citations.map(citation=>citation.title)});
  } catch {results.push({id:item.id,ok:false,status:"error",answer:"Falha do provedor",sources:[]});}
  writeFileSync("/tmp/directscal-agent-role-check.json",JSON.stringify({provider:config,controlledSources:true,results},null,2));
 }
 expect(results.filter(item=>!item.ok)).toEqual([]);
}, 10*60*1000);
