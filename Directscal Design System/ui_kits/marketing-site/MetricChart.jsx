/* global React */

function MetricChart() {
  return (
    <section className="ds-section" id="metric">
      <div className="ds-container">
        <div className="ds-chart-wrap">
          <div className="ds-chart-side">
            <span className="ds-eyebrow">Painel · clientes em execução</span>
            <h2 className="ds-section-title">Margem operacional<br/>após 90 dias.</h2>
            <p className="ds-section-lede">
              Mediana dos clientes em ciclo de execução, comparada à baseline pré-engajamento e à média setorial.
            </p>
            <div className="ds-chart-legend">
              <span className="ds-legend-item"><span className="ds-legend-dot" style={{background:'#185EFF'}}></span>Pós-Directscal</span>
              <span className="ds-legend-item"><span className="ds-legend-dot" style={{background:'#0B2E78'}}></span>Baseline</span>
              <span className="ds-legend-item"><span className="ds-legend-dot" style={{background:'#C9C9CE'}}></span>Setor</span>
            </div>
          </div>
          <div className="ds-chart-card">
            <svg viewBox="0 0 600 320" preserveAspectRatio="none" style={{width:'100%', height: 'auto', display:'block'}}>
              {/* grid */}
              {[40, 100, 160, 220, 280].map(y => (
                <line key={y} x1="50" y1={y} x2="590" y2={y} stroke="#EEEEF0" strokeWidth="1"/>
              ))}
              <line x1="50" y1="280" x2="590" y2="280" stroke="#C9C9CE" strokeWidth="1"/>
              {/* y ticks */}
              {[
                ['40%', 40], ['30%', 100], ['20%', 160], ['10%', 220], ['0%', 280]
              ].map(([t, y]) => (
                <text key={t} x="14" y={y+4} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6E6E76">{t}</text>
              ))}
              {/* setor (gray) */}
              <polyline points="50,210 130,208 220,206 310,205 400,204 490,203 580,203" stroke="#C9C9CE" strokeWidth="1.5" fill="none"/>
              {/* baseline (navy dashed) */}
              <polyline points="50,200 130,198 220,197 310,198 400,197 490,198 580,197" stroke="#0B2E78" strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
              {/* post-directscal (brand) */}
              <polyline points="50,196 130,180 220,150 310,118 400,90 490,62 580,40" stroke="#185EFF" strokeWidth="2.5" fill="none"/>
              {/* end markers */}
              <circle cx="580" cy="40" r="5" fill="#185EFF"/>
              <circle cx="580" cy="40" r="10" fill="#185EFF" opacity="0.12"/>
              {/* x labels */}
              <text x="50"  y="305" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6E6E76">Q1·24</text>
              <text x="220" y="305" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6E6E76">Q3·24</text>
              <text x="400" y="305" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6E6E76">Q1·25</text>
              <text x="555" y="305" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6E6E76">Q4·25</text>
              {/* annotation */}
              <text x="500" y="32" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" fill="#0F3FAE">+38pp</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

window.MetricChart = MetricChart;
