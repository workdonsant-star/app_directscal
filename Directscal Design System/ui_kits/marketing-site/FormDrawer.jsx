/* global React */
const { useState, useEffect } = React;

function FormDrawer() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState({ company: '', stage: '', focus: 'Pricing & retenção', email: '' });

  useEffect(() => {
    const h = () => { setOpen(true); setSubmitted(false); };
    window.addEventListener('open-form', h);
    return () => window.removeEventListener('open-form', h);
  }, []);

  if (!open) return null;
  return (
    <div className="ds-drawer-backdrop" onClick={() => setOpen(false)}>
      <aside className="ds-drawer" onClick={e => e.stopPropagation()}>
        <header className="ds-drawer-head">
          <span className="ds-eyebrow">Solicitar diagnóstico</span>
          <button className="ds-icon-btn" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
        </header>
        {!submitted ? (
          <form className="ds-drawer-body" onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
            <h3 className="ds-drawer-title">Entender se faz sentido conversar.</h3>
            <p className="ds-drawer-lede">Resposta em até 2 dias úteis. Sem follow-up automático.</p>

            <label className="ds-field">
              <span>Empresa</span>
              <input className="ds-input" placeholder="Razão social" required value={data.company} onChange={e => setData({...data, company: e.target.value})}/>
            </label>
            <label className="ds-field">
              <span>Estágio</span>
              <select className="ds-input ds-select" required value={data.stage} onChange={e => setData({...data, stage: e.target.value})}>
                <option value="">Selecione</option>
                <option>Pré-receita</option>
                <option>R$ 1–10M ARR</option>
                <option>R$ 10–50M ARR</option>
                <option>R$ 50M+ ARR</option>
              </select>
            </label>
            <label className="ds-field">
              <span>Foco</span>
              <select className="ds-input ds-select" value={data.focus} onChange={e => setData({...data, focus: e.target.value})}>
                <option>Pricing & retenção</option>
                <option>Aquisição & funil</option>
                <option>Unit economics</option>
                <option>Governança & operação</option>
              </select>
            </label>
            <label className="ds-field">
              <span>E-mail corporativo</span>
              <input className="ds-input" type="email" placeholder="voce@empresa.com" required value={data.email} onChange={e => setData({...data, email: e.target.value})}/>
            </label>

            <div className="ds-drawer-foot">
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg">Enviar <span className="ds-arrow">→</span></button>
              <span className="ds-hint">Não compartilhamos com terceiros.</span>
            </div>
          </form>
        ) : (
          <div className="ds-drawer-body ds-drawer-success">
            <div className="ds-success-mark">✓</div>
            <h3 className="ds-drawer-title">Recebido.</h3>
            <p className="ds-drawer-lede">Vamos analisar e responder em até 2 dias úteis com um plano de diagnóstico ou um declínio direto.</p>
            <button className="ds-btn ds-btn-secondary" onClick={() => setOpen(false)}>Fechar</button>
          </div>
        )}
      </aside>
    </div>
  );
}

window.FormDrawer = FormDrawer;
