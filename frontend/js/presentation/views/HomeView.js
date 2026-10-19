import { interactionModes, modeLabels } from '../../domain/InteractionMode.js';

export class HomeView {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <header class="topbar">
        <a class="brand" href="#" aria-label="e-Agro 3D Studio"><span class="brand-mark">e</span><span>Agro <b>3D</b></span></a>
        <nav class="topbar-actions">
          <button class="button secondary" data-action="library">Modelos</button>
          <button class="button secondary" data-action="wizard">Criar modelo por imagem</button>
          <button class="button run" data-action="run"><span class="run-dot"></span> RUN</button>
        </nav>
      </header>
      <main class="studio-shell">
        <section class="intro-panel" data-intro>
          <p class="eyebrow">ESTÚDIO INTERATIVO</p>
          <h1>Entenda sua cultura<br>em <em>três dimensões.</em></h1>
          <p class="intro-copy">Carregue modelos agrícolas, gere uma prévia a partir de fotos e examine cada detalhe usando gestos naturais.</p>
          <div class="selected-model" data-selected-model><span class="model-orb">◒</span><span><small>MODELO ATIVO</small><strong>Nenhum modelo selecionado</strong></span></div>
          <p class="support-copy">Use os botões acima para começar. O gerador por imagem funciona mesmo sem GPU usando o modo demonstrativo.</p>
        </section>
        <section class="viewport" data-viewport aria-label="Visualizador 3D">
          <div class="viewport-stage" data-scene></div>
          <div class="camera-layer" data-camera-layer></div>
          <div class="viewport-empty" data-empty-state><span class="empty-leaf">⌇</span><p>Selecione um modelo e pressione <b>RUN</b></p></div>
          <aside class="hud" data-hud hidden>
            <p class="eyebrow">MODO ATIVO</p><strong data-hud-mode>Arrastar</strong>
            <p data-hud-hint>Una o polegar e o indicador para mover.</p>
          </aside>
          <div class="voice-status" data-voice-status hidden>Voz: ouvindo…</div>
        </section>
      </main>
      <div class="mode-dock" data-mode-dock hidden>${interactionModes.map((mode) => `<button data-mode="${mode}">${modeLabels[mode]}</button>`).join('')}</div>
      <div class="toast" data-toast role="status" aria-live="polite"></div>`;
    this.elements = {
      library: root.querySelector('[data-action="library"]'), wizard: root.querySelector('[data-action="wizard"]'), run: root.querySelector('[data-action="run"]'),
      selected: root.querySelector('[data-selected-model]'), scene: root.querySelector('[data-scene]'), camera: root.querySelector('[data-camera-layer]'), empty: root.querySelector('[data-empty-state]'),
      dock: root.querySelector('[data-mode-dock]'), hud: root.querySelector('[data-hud]'), hudMode: root.querySelector('[data-hud-mode]'), hudHint: root.querySelector('[data-hud-hint]'), voice: root.querySelector('[data-voice-status]'), toast: root.querySelector('[data-toast]'),
    };
  }

  bind({ onLibrary, onWizard, onRun, onMode }) {
    this.elements.library.addEventListener('click', onLibrary);
    this.elements.wizard.addEventListener('click', onWizard);
    this.elements.run.addEventListener('click', onRun);
    this.elements.dock.addEventListener('click', (event) => { const mode = event.target.dataset.mode; if (mode) onMode(mode); });
  }

  renderState(state) {
    const model = state.activeModel;
    this.elements.selected.innerHTML = model
      ? `<span class="model-orb">${categoryIcon(model.category)}</span><span><small>MODELO ATIVO</small><strong>${escapeHtml(model.name)}</strong></span>`
      : '<span class="model-orb">◒</span><span><small>MODELO ATIVO</small><strong>Nenhum modelo selecionado</strong></span>';
    this.elements.run.disabled = !model;
    this.elements.run.classList.toggle('is-active', state.isRunning);
    this.elements.run.lastChild.textContent = state.isRunning ? ' PAUSAR' : ' RUN';
    this.elements.empty.hidden = state.isRunning;
    this.elements.dock.hidden = !state.isRunning;
    this.elements.hud.hidden = !state.isRunning;
    this.setMode(state.interactionMode);
  }

  setMode(mode) {
    this.elements.hudMode.textContent = modeLabels[mode];
    this.elements.hudHint.textContent = { drag: 'Una o polegar e o indicador para mover.', rotate: 'Faça uma pinça e mova a mão lateralmente.', scale: 'Faça pinça com as duas mãos e aproxime ou afaste.', animate: 'Faça uma pinça para reproduzir a animação.' }[mode];
    this.elements.dock.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  }

  showVoice(transcript) { this.elements.voice.hidden = !transcript; this.elements.voice.textContent = transcript ? `Voz: “${transcript}”` : ''; }
  toast(message, type = 'normal') { const toast = this.elements.toast; toast.textContent = message; toast.dataset.type = type; toast.classList.add('show'); clearTimeout(this.toastTimeout); this.toastTimeout = setTimeout(() => toast.classList.remove('show'), 4200); }
}

function categoryIcon(category) { return ({ fruit: '◒', plant: '⌇', seed: '◉', seedling: '♧', machinery: '⚙' })[category] || '◈'; }
function escapeHtml(value) { const element = document.createElement('span'); element.textContent = value; return element.innerHTML; }
