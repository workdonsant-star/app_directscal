/* global React */
const { useState } = React;

function Nav() {
  const [openDrawer, setOpenDrawer] = useState(false);
  return (
    <header className="ds-nav">
      <div className="ds-nav-inner">
        <a className="ds-nav-brand" href="#">
          <img src="../../assets/directscal-logo.svg" alt="Directscal" />
        </a>
        <nav className="ds-nav-links">
          <a href="#metodo">Método</a>
          <a href="#casos">Casos</a>
          <a href="#diagnostico">Diagnóstico</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="ds-nav-actions">
          <a className="ds-link-quiet" href="#login">Entrar</a>
          <button className="ds-btn ds-btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('open-form'))}>
            Solicitar diagnóstico <span className="ds-arrow">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}

window.Nav = Nav;
