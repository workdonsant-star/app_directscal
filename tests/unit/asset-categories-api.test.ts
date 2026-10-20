import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/profile-data-source", () => ({ getProfileSettingsData: vi.fn() }));
vi.mock("@/lib/data/asset-navigation-data-source", () => ({ saveAssetCategory: vi.fn(), deleteAssetCategory: vi.fn(), getAssetCategoryDocumentCount: vi.fn() }));
vi.mock("@/lib/data/management-assets-data-source", () => ({ getPublishedManagementAssetFolders: vi.fn() }));
import { POST, PATCH, GET, DELETE } from "@/app/api/settings/asset-categories/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { saveAssetCategory, deleteAssetCategory, getAssetCategoryDocumentCount } from "@/lib/data/asset-navigation-data-source";
import { getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";
const session = (role="cliente",extra={}) => ({ user:{id:"ator",role},...extra }) as Awaited<ReturnType<typeof getCurrentAuthSession>>;
const request = (body:unknown) => new Request("http://localhost/api/settings/asset-categories",{method:"POST",body:JSON.stringify(body)});
beforeEach(()=>{
  vi.resetAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session());
  vi.mocked(getProfileSettingsData).mockResolvedValue({organizationId:"empresa"} as Awaited<ReturnType<typeof getProfileSettingsData>>);
  vi.mocked(getPublishedManagementAssetFolders).mockResolvedValue([{key:"cultura",title:"Cultura",href:"/ativos-de-gestao/cultura",count:0}]);
  vi.mocked(saveAssetCategory).mockResolvedValue({key:"nova",title:"Nova"});
  vi.mocked(getAssetCategoryDocumentCount).mockResolvedValue(3);
  vi.mocked(deleteAssetCategory).mockResolvedValue({ movedCount: 3, destinationKey: "nova" });
});
describe("categorias persistidas",()=>{
  it("exige sessão",async()=>{vi.mocked(getCurrentAuthSession).mockResolvedValue(null);expect((await POST(request({title:"Nova"}))).status).toBe(401);});
  it.each([session("admin"),session("superadmin"),session("cliente",{acquisition:true}),session("cliente",{leadershipInvitation:true})])("nega escrita sem dono definitivo",async value=>{vi.mocked(getCurrentAuthSession).mockResolvedValue(value);expect((await POST(request({title:"Nova"}))).status).toBe(403);expect(saveAssetCategory).not.toHaveBeenCalled();});
  it.each([{title:" "},{title:"x".repeat(81)},{title:"Nova",organizationId:"outra"},{title:"Nova",actorId:"outro"},{title:"Nova",key:"indevido"}])("valida criação estrita",async body=>{expect((await POST(request(body))).status).toBe(400);expect(saveAssetCategory).not.toHaveBeenCalled();});
  it("cria pasta vazia com empresa/ator do servidor",async()=>{expect((await POST(request({title:"  Nova   área "}))).status).toBe(201);expect(saveAssetCategory).toHaveBeenCalledWith("empresa","ator",{title:"Nova área"},null);});
  it("renomeia com título anterior do servidor",async()=>{expect((await PATCH(request({key:"cultura",title:"Valores"}))).status).toBe(200);expect(saveAssetCategory).toHaveBeenCalledWith("empresa","ator",{key:"cultura",title:"Valores"},"Cultura");});
  it("nega renomear pasta desconhecida",async()=>{expect((await PATCH(request({key:"outra",title:"Valores"}))).status).toBe(409);expect(saveAssetCategory).not.toHaveBeenCalled();});
  it("oculta falhas internas e informa duplicatas",async()=>{vi.mocked(saveAssetCategory).mockRejectedValueOnce(new Error("segredo"));expect(await (await POST(request({title:"Nova"}))).text()).not.toContain("segredo");vi.mocked(saveAssetCategory).mockRejectedValueOnce(new Error("Já existe uma categoria com esse nome."));expect(await (await POST(request({title:"Nova"}))).text()).toContain("Já existe");});
});

describe("exclusão com redistribuição obrigatória",()=>{
  it.each([null,session("admin"),session("superadmin"),session("cliente",{acquisition:true}),session("cliente",{leadershipInvitation:true})])("protege consulta e exclusão",async value=>{
    vi.mocked(getCurrentAuthSession).mockResolvedValue(value);
    expect((await DELETE(request({key:"cultura"}))).status).toBe(value ? 403 : 401);
    expect((await GET(new Request("http://localhost/api/settings/asset-categories?key=cultura"))).status).toBe(value ? 403 : 401);
    expect(deleteAssetCategory).not.toHaveBeenCalled();expect(getAssetCategoryDocumentCount).not.toHaveBeenCalled();
  });
  it("consulta contagem com empresa e ator da sessão",async()=>{
    const response=await GET(new Request("http://localhost/api/settings/asset-categories?key=cultura"));
    expect(await response.json()).toEqual({count:3});
    expect(getAssetCategoryDocumentCount).toHaveBeenCalledWith("empresa","ator","cultura");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it.each([{key:"cultura",organizationId:"outra"},{key:"cultura",destinationKey:"outra",newTitle:"Nova"},{key:"cultura",newTitle:" "},{key:"cultura",destinationKey:"cultura"},{key:"cultura",destinationKey:"desconhecida"},{}])("recusa payload ou destino inválido",async body=>{
    expect((await DELETE(request(body))).status).toBe(400);expect(deleteAssetCategory).not.toHaveBeenCalled();
  });
  it.each([{key:"cultura",newTitle:"Nova"},{key:"cultura"}])("delega criação atômica ou categoria vazia à transação",async body=>{
    expect((await DELETE(request(body))).status).toBe(200);expect(deleteAssetCategory).toHaveBeenCalledWith("empresa","ator",body,"Cultura");
  });
  it("aceita destino existente de outra pasta",async()=>{
    vi.mocked(getPublishedManagementAssetFolders).mockResolvedValue([{key:"cultura",title:"Cultura",href:"/cultura",count:3},{key:"destino",title:"Destino",href:"/destino",count:0}]);
    expect((await DELETE(request({key:"cultura",destinationKey:"destino"}))).status).toBe(200);
    expect(deleteAssetCategory).toHaveBeenCalledWith("empresa","ator",{key:"cultura",destinationKey:"destino"},"Cultura");
  });
  it("expõe exigência de destino sem vazar erro interno",async()=>{
    vi.mocked(deleteAssetCategory).mockRejectedValueOnce(new Error("Escolha outra categoria de destino ou crie uma nova para receber os documentos."));
    expect((await DELETE(request({key:"cultura"}))).status).toBe(409);
    vi.mocked(deleteAssetCategory).mockRejectedValueOnce(new Error("segredo"));
    expect(await (await DELETE(request({key:"cultura"}))).text()).not.toContain("segredo");
  });
});
