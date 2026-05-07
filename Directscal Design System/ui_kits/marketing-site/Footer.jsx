/* global React */

function Footer() {
  return (
    <footer className="ds-footer">
      <div className="ds-container">
        <div className="ds-footer-grid">
          <div className="ds-footer-brand">
            <img src="../../assets/directscal-logo.svg" alt="Directscal" className="ds-footer-logo" />
            <p className="ds-footer-blurb">
              Estruturação de negócios digitais. Diagnóstico, plano, execução acompanhada.
            </p>
          </div>
          <div className="ds-footer-col">
            <span className="ds-eyebrow">Empresa</span>
            <a href="#">Método</a>
            <a href="#">Casos</a>
            <a href="#">Equipe</a>
            <a href="#">Carreiras</a>
          </div>
          <div className="ds-footer-col">
            <span className="ds-eyebrow">Recursos</span>
            <a href="#">Playbook de pricing</a>
            <a href="#">Cohort calculator</a>
            <a href="#">Newsletter</a>
          </div>
          <div className="ds-footer-col">
            <span className="ds-eyebrow">Contato</span>
            <a href="mailto:contato@directscal.com">contato@directscal.com</a>
            <a href="#">São Paulo · BR</a>
          </div>
        </div>
        <div className="ds-footer-bottom">
          <span>© 2026 Directscal Serviços e Tecnologia.</span>
          <span><a href="#">Privacidade</a> · <a href="#">Termos</a></span>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
