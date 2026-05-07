/* global React */

const CASES = [
  { sector: 'SaaS B2B', title: 'Pricing redesenhado em 6 semanas', metric: '+38%', metricLabel: 'margem op.', size: 'R$ 32M ARR' },
  { sector: 'Marketplace', title: 'Funil de aquisição refeito do zero', metric: '−42%', metricLabel: 'CAC', size: 'R$ 8M ARR' },
  { sector: 'Fintech', title: 'Governança financeira para Série B', metric: '+12pp', metricLabel: 'NRR', size: 'R$ 54M ARR' },
  { sector: 'D2C', title: 'Modelo de unit economics validado', metric: '2.4x', metricLabel: 'LTV/CAC', size: 'R$ 14M ARR' },
];

function CaseGrid() {
  return (
    <section className="ds-section ds-section-muted" id="casos">
      <div className="ds-container">
        <div className="ds-section-head">
          <span className="ds-eyebrow">Casos selecionados</span>
          <h2 className="ds-section-title">Resultados, não testimonials.</h2>
        </div>
        <div className="ds-case-grid">
          {CASES.map((c, i) => (
            <a className="ds-case-card" href="#" key={i}>
              <div className="ds-case-meta">
                <span className="ds-eyebrow">{c.sector}</span>
                <span className="ds-case-size">{c.size}</span>
              </div>
              <h3 className="ds-case-title">{c.title}</h3>
              <div className="ds-case-metric">
                <span className="ds-case-num">{c.metric}</span>
                <span className="ds-case-num-lab">{c.metricLabel}</span>
              </div>
              <span className="ds-case-link">Ler estudo de caso →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

window.CaseGrid = CaseGrid;
