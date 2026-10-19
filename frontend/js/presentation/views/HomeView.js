import {
  interactionModes,
  modeLabels,
  VisualizationMode,
  visualizationModes,
  visualizationLabels,
} from '../../domain/InteractionMode.js';

export class HomeView {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <a class="brand" href="#" aria-label="e-Agro 3D Studio"><span class="brand-mark">e</span><span>Agro <b>3D</b></span></a>
          <button class="button ghost sidebar-toggle" type="button" data-action="toggle-sidebar" title="Mostrar ou ocultar painel lateral">Painel</button>
        </div>
        <div class="view-switcher" data-view-switcher role="group" aria-label="Modo de visualização">
          ${visualizationModes.map((mode) => `
            <button type="button" class="view-switch-btn" data-view-mode="${mode}">
              <span class="view-switch-icon">${mode === VisualizationMode.CAMERA_AR ? '📷' : '◧'}</span>
              <span>${visualizationLabels[mode]}</span>
            </button>
          `).join('')}
        </div>
        <nav class="topbar-actions">
          <button class="button secondary" data-action="library">Modelos</button>
          <button class="button secondary" data-action="wizard">Criar modelo por imagem</button>
          <button class="button run" data-action="run"><span class="run-dot"></span> RUN</button>
        </nav>
      </header>
      <main class="studio-shell" data-shell data-view-mode="studio">
        <section class="intro-panel" data-intro>
          <p class="eyebrow">ESTÚDIO INTERATIVO</p>
          <h1>Entenda sua cultura<br>em <em>três dimensões.</em></h1>
          <p class="intro-copy">Carregue modelos agrícolas, gere uma prévia a partir de fotos e examine cada detalhe usando gestos naturais.</p>
          <div class="selected-model" data-selected-model><span class="model-orb">◒</span><span><small>MODELO ATIVO</small><strong>Nenhum modelo selecionado</strong></span></div>
          <p class="support-copy">Escolha entre <b>Estúdio + Webcam</b> (cenário 3D amplo com câmera no canto inferior direito) ou <b>Câmera Real (AR)</b> (modelo 3D dentro da sua câmera no mundo real) e pressione <b>RUN</b>.</p>
        </section>
        <section class="viewport" data-viewport data-view-mode="studio" aria-label="Visualizador 3D">
          <div class="viewport-stage" data-scene></div>
          <div class="camera-layer" data-camera-layer hidden></div>
          <div class="viewport-empty" data-empty-state><span class="empty-leaf">⌇</span><p>Selecione um modelo e pressione <b>RUN</b></p></div>
          <aside class="hud" data-hud hidden>
            <p class="eyebrow" data-hud-view-label>ESTÚDIO + WEBCAM</p>
            <strong data-hud-mode>Arrastar</strong>
            <p data-hud-hint>Una o polegar e o indicador (pinça) e mova a mão para arrastar o modelo.</p>
          </aside>
          <div class="voice-status" data-voice-status hidden>Voz: ouvindo…</div>
        </section>
      </main>
      <div class="mode-dock" data-mode-dock hidden>
        ${interactionModes.map((mode) => `<button type="button" data-mode="${mode}">${modeLabels[mode]}</button>`).join('')}
        <span class="dock-divider" aria-hidden="true"></span>
        <button type="button" class="dock-reset" data-action="reset-transform" title="Centralizar modelo">Centralizar</button>
      </div>
      <div class="toast" data-toast role="status" aria-live="polite"></div>`;
    this.elements = {
      shell: root.querySelector('[data-shell]'),
      intro: root.querySelector('[data-intro]'),
      viewport: root.querySelector('[data-viewport]'),
      viewSwitcher: root.querySelector('[data-view-switcher]'),
      toggleSidebar: root.querySelector('[data-action="toggle-sidebar"]'),
      library: root.querySelector('[data-action="library"]'),
      wizard: root.querySelector('[data-action="wizard"]'),
      run: root.querySelector('[data-action="run"]'),
      selected: root.querySelector('[data-selected-model]'),
      scene: root.querySelector('[data-scene]'),
      camera: root.querySelector('[data-camera-layer]'),
      empty: root.querySelector('[data-empty-state]'),
      dock: root.querySelector('[data-mode-dock]'),
      resetTransform: root.querySelector('[data-action="reset-transform"]'),
      hud: root.querySelector('[data-hud]'),
      hudViewLabel: root.querySelector('[data-hud-view-label]'),
      hudMode: root.querySelector('[data-hud-mode]'),
      hudHint: root.querySelector('[data-hud-hint]'),
      voice: root.querySelector('[data-voice-status]'),
      toast: root.querySelector('[data-toast]'),
    };
  }

  bind({ onLibrary, onWizard, onRun, onMode, onVisualization, onToggleSidebar, onResetTransform }) {
    this.elements.library.addEventListener('click', onLibrary);
    this.elements.wizard.addEventListener('click', onWizard);
    this.elements.run.addEventListener('click', onRun);
    this.elements.toggleSidebar.addEventListener('click', onToggleSidebar);
    this.elements.resetTransform.addEventListener('click', onResetTransform);
    this.elements.viewSwitcher.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-view-mode]');
      if (btn) onVisualization(btn.dataset.viewMode);
    });
    this.elements.dock.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-mode]');
      if (btn) onMode(btn.dataset.mode);
    });
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
    this.elements.camera.hidden = !state.isRunning;
    this.elements.dock.hidden = !state.isRunning;
    this.elements.hud.hidden = !state.isRunning;

    const collapseSidebar = Boolean(state.sidebarCollapsed || (state.isRunning && state.visualizationMode === VisualizationMode.CAMERA_AR));
    this.elements.shell.classList.toggle('is-sidebar-collapsed', collapseSidebar);
    this.elements.shell.classList.toggle('is-running', state.isRunning);
    this.elements.shell.dataset.viewMode = state.visualizationMode;
    this.elements.viewport.dataset.viewMode = state.visualizationMode;
    this.elements.toggleSidebar.textContent = collapseSidebar ? 'Mostrar painel' : 'Ocultar painel';

    this.elements.viewSwitcher.querySelectorAll('[data-view-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.viewMode === state.visualizationMode);
    });
    this.elements.hudViewLabel.textContent = state.visualizationMode === VisualizationMode.CAMERA_AR
      ? 'CÂMERA REAL (AR) · MODO ATIVO'
      : 'ESTÚDIO 3D · MODO ATIVO';
    this.setMode(state.interactionMode);
  }

  setMode(mode) {
    this.elements.hudMode.textContent = modeLabels[mode];
    this.elements.hudHint.textContent = {
      drag: 'Una o polegar e o indicador (pinça) para segurar e mover o modelo 3D.',
      rotate: 'Faça uma pinça e mova a mão para girar o modelo em qualquer direção.',
      scale: 'Faça pinça com as duas mãos e afaste ou aproxime para escalar.',
      animate: 'Faça uma pinça (e mova para cima/baixo) para alternar a animação.',
    }[mode];
    this.elements.dock.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  }

  showVoice(transcript) { this.elements.voice.hidden = !transcript; this.elements.voice.textContent = transcript ? `Voz: “${transcript}”` : ''; }
  toast(message, type = 'normal') { const toast = this.elements.toast; toast.textContent = message; toast.dataset.type = type; toast.classList.add('show'); clearTimeout(this.toastTimeout); this.toastTimeout = setTimeout(() => toast.classList.remove('show'), 4200); }
}

function categoryIcon(category) { return ({ fruit: '◒', plant: '⌇', seed: '◉', seedling: '♧', machinery: '⚙' })[category] || '◈'; }
function escapeHtml(value) { const element = document.createElement('span'); element.textContent = value; return element.innerHTML; }
