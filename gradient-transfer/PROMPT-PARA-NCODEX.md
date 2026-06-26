# Prompt para mandar ao outro Codex

Quero aplicar neste site o mesmo efeito de gradiente animado do hero da DirectScal.

Use estes arquivos como fonte:

- `stripe-gradient.js`: script WebGL completo do gradiente animado.
- `hero-scroll.js`: script que sincroniza o tamanho do card e do canvas durante o scroll.
- `gradient-effect.css`: CSS isolado com as variaveis, o canvas, os overlays e a responsividade.
- `example.html`: exemplo minimo de HTML com os atributos e classes corretos.

Regras de implementacao:

1. Copie `stripe-gradient.js` e `hero-scroll.js` para o projeto novo e carregue os dois com `defer`.
2. Importe o CSS de `gradient-effect.css` ou migre os blocos para o CSS existente do projeto.
3. No HTML/JSX, mantenha estes pontos obrigatorios:
   - Um wrapper com `data-expand-stage`.
   - Um card com `class="hero-card"` e `data-expand-card`.
   - Um canvas com `id="gradient-canvas"` e `class="hero-card__gradient"`.
4. Se o projeto for React/Next, renderize o canvas apenas no client e carregue os scripts de forma compatível com o framework.
5. Preserve as variaveis CSS `--feature-*`, porque o `hero-scroll.js` atualiza essas variaveis em tempo real.
6. Depois de aplicar, valide desktop e mobile. O canvas precisa cobrir o card inteiro, sem bordas brancas e sem deslocar o conteudo.

HTML minimo esperado:

```html
<link rel="stylesheet" href="./gradient-effect.css">
<script src="./stripe-gradient.js" defer></script>
<script src="./hero-scroll.js" defer></script>

<section class="hero">
  <div class="hero-card-stage" data-expand-stage>
    <article class="hero-card" data-expand-card>
      <canvas id="gradient-canvas" class="hero-card__gradient" data-gradient-canvas aria-hidden="true"></canvas>
      <div class="hero-card__inner">
        <div class="hero-card__copy">
          <h2>Titulo do card</h2>
          <div class="hero-card__bottom">
            <p>Texto do card.</p>
            <a class="cta-btn cta-btn--light hero-card__cta" href="#">CTA</a>
          </div>
        </div>
      </div>
    </article>
  </div>
</section>
```

Se quiser mudar as cores do gradiente, altere somente estas variaveis em `.hero-card__gradient`:

```css
.hero-card__gradient {
  --gradient-color-1: #1846ef;
  --gradient-color-2: #12086f;
  --gradient-color-3: #ade517;
  --gradient-color-4: #1846ef;
}
```
