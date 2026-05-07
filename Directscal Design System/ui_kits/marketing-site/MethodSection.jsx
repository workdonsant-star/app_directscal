/* global React */

const STEPS = [
  {
    n: '01',
    label: 'Diagnóstico',
    days: '14 dias',
    desc: 'Mapeamento de receita, custo, funil e operação. Entrega: relatório quantitativo + recomendações priorizadas.',
    points: ['Auditoria de pricing', 'Cohort de retenção', 'Funil de aquisição', 'Estrutura de custo']
  },
  {
    n: '02',
    label: 'Plano',
    days: '30 dias',
    desc: 'Plano de execução de 90 dias com OKRs, owner por iniciativa e modelo financeiro projetado.',
    points: ['OKRs por área', 'Modelo financeiro', 'Roadmap operacional', 'Governança semanal']
  },
  {
    n: '03',
    label: 'Execução',
    days: '90 dias',
    desc: 'Acompanhamento semanal com a liderança. Atuamos lado-a-lado nas decisões, não só em deck.',
    points: ['Reuniões semanais', 'Painel ao vivo', 'Decisões de pricing', 'Hand-off documentado']
  }
];

function MethodSection() {
  return (
    <section className="ds-section" id="metodo">
      <div className="ds-container">
        <div className="ds-section-head">
          <span className="ds-eyebrow">Método</span>
          <h2 className="ds-section-title">Diagnóstico, plano, execução.<br/><span className="ds-fg-muted">Nada em paralelo.</span></h2>
        </div>
        <div className="ds-method-grid">
          {STEPS.map(s => (
            <article className="ds-method-card" key={s.n}>
              <div className="ds-method-head">
                <span className="ds-method-n">{s.n}</span>
                <span className="ds-method-days">{s.days}</span>
              </div>
              <h3 className="ds-method-label">{s.label}</h3>
              <p className="ds-method-desc">{s.desc}</p>
              <ul className="ds-method-list">
                {s.points.map(p => <li key={p}>{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.MethodSection = MethodSection;
