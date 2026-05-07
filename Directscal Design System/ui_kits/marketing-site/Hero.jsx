/* global React */

function Hero() {
  return (
    <section className="ds-hero">
      <div className="ds-container">
        <span className="ds-eyebrow">Estruturação · Operação · Escala</span>
        <h1 className="ds-hero-title">
          Estruturamos negócios digitais<br/>
          <span className="ds-hero-em">para crescer com margem.</span>
        </h1>
        <p className="ds-hero-lede">
          Trabalhamos como time externo de estruturação. Diagnóstico em 14 dias,
          plano em 30, execução acompanhada por 90. Pricing, aquisição, operação
          e governança — sem boilerplate.
        </p>
        <div className="ds-hero-cta">
          <button className="ds-btn ds-btn-primary ds-btn-lg" onClick={() => window.dispatchEvent(new CustomEvent('open-form'))}>
            Solicitar diagnóstico <span className="ds-arrow">→</span>
          </button>
          <a className="ds-btn ds-btn-secondary ds-btn-lg" href="#metodo">Ver método</a>
        </div>

        <div className="ds-kpi-strip">
          <div className="ds-kpi">
            <div className="ds-kpi-num">+38<span className="ds-kpi-unit">%</span></div>
            <div className="ds-kpi-lab">Margem operacional<br/>média em 90 dias</div>
          </div>
          <div className="ds-kpi">
            <div className="ds-kpi-num">14<span className="ds-kpi-unit">d</span></div>
            <div className="ds-kpi-lab">Diagnóstico inicial<br/>com plano de ação</div>
          </div>
          <div className="ds-kpi">
            <div className="ds-kpi-num">42</div>
            <div className="ds-kpi-lab">Negócios estruturados<br/>desde 2022</div>
          </div>
          <div className="ds-kpi">
            <div className="ds-kpi-num">R$ 1.2<span className="ds-kpi-unit">B</span></div>
            <div className="ds-kpi-lab">ARR sob gestão<br/>direta ou advisory</div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
