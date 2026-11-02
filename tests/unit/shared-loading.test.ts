import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpecialistsProvider, useSpecialists } from "@/components/admin/use-specialists";
import { useInitiatives } from "@/lib/initiatives/storage";

describe("dados antes de renderizar opções", () => {
  function SpecialistOptions() {
    const { specialists, getSpecialist } = useSpecialists();
    return createElement("p", null, `${specialists.length}: ${getSpecialist("specialist_test")?.name ?? "Sem especialista"}`);
  }

  it("resolve o especialista no HTML inicial sem esperar uma chamada no cliente", () => {
    const html = renderToStaticMarkup(createElement(SpecialistsProvider, {
      initialSpecialists: [{ id: "specialist_test", name: "Especialista persistido", email: "teste@example.invalid",
        title: "Consultor", location: "São Paulo", status: "ativo", archived: false, companyCount: 1,
        activeDeliveryCount: 1, createdAt: "2026-10-29T12:00:00Z" }],
    }, createElement(SpecialistOptions)));
    expect(html).toContain("1: Especialista persistido");
    expect(html).not.toContain("Sem especialista");
  });

  it("preserva um diretório realmente vazio", () => {
    expect(renderToStaticMarkup(createElement(SpecialistsProvider, {
      initialSpecialists: [],
    }, createElement(SpecialistOptions)))).toContain("0: Sem especialista");
  });

  it("não exibe exemplos nem permite salvar iniciativas antes de ler o armazenamento", () => {
    function Initiatives() {
      const { initiatives, isLoaded, save } = useInitiatives("fixture");
      expect(isLoaded).toBe(false);
      expect(initiatives).toEqual([]);
      expect(save([])).toBe(false);
      return createElement("p", null, isLoaded ? initiatives.map(item => item.title).join(", ") : "Carregando iniciativas");
    }
    expect(renderToStaticMarkup(createElement(Initiatives))).toBe("<p>Carregando iniciativas</p>");
  });
});
