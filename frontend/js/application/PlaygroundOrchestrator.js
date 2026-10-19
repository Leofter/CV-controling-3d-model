import { InteractionMode, interactionModes } from '../domain/InteractionMode.js';

export class PlaygroundOrchestrator {
  constructor({ state, sceneManager, modelLoader, transformController, handTracker, voiceService, backendClient, homeView, libraryModal, wizardView }) {
    this.state = state; this.sceneManager = sceneManager; this.modelLoader = modelLoader; this.transformController = transformController;
    this.handTracker = handTracker; this.voiceService = voiceService; this.backendClient = backendClient;
    this.homeView = homeView; this.libraryModal = libraryModal; this.wizardView = wizardView;
    this.loadedModelId = null;
  }

  async initialize() {
    this.state.subscribe((state) => this.homeView.renderState(state));
    this.homeView.bind({
      onLibrary: () => this.openLibrary(), onWizard: () => this.openWizard(), onRun: () => this.toggleRun(), onMode: (mode) => this.setMode(mode),
    });
    try { await this.refreshModels(); }
    catch (error) { this.homeView.toast(`${error.message} Inicie o backend para acessar o catálogo.`, 'error'); }
  }

  async refreshModels() { this.state.setModels(await this.backendClient.listModels()); }

  openLibrary() {
    const { models, activeModel } = this.state.state;
    this.libraryModal.open(models, activeModel, {
      onSelect: (id) => { const model = this.state.state.models.find((item) => item.id === id); if (model) { this.selectModel(model); this.libraryModal.close(); } },
      onUpload: async (payload) => {
        this.homeView.toast('Enviando e normalizando o modelo…');
        const created = await this.backendClient.uploadModel(payload);
        await this.refreshModels(); this.selectModel(this.state.state.models.find((model) => model.id === created.id) || created);
        this.libraryModal.close(); this.homeView.toast('Modelo disponível no catálogo.');
      },
    });
  }

  openWizard() {
    this.wizardView.open({ onGenerate: async ({ name, category, images, setProgress }) => {
      const stages = ['Removendo fundo das capturas…', 'Gerando geometria 3D…', 'Otimizando malha e texturas…'];
      let index = 0; const timer = window.setInterval(() => { index = Math.min(index + 1, stages.length - 1); setProgress(stages[index]); }, 1800);
      try {
        const created = await this.backendClient.generateFromImages({ name, category, images });
        clearInterval(timer); setProgress('Modelo pronto para interação.');
        await this.refreshModels(); this.selectModel(this.state.state.models.find((model) => model.id === created.id) || created);
        window.setTimeout(() => this.wizardView.close(), 700);
        this.homeView.toast('Novo modelo criado e selecionado.');
      } catch (error) { clearInterval(timer); throw error; }
    }});
  }

  async selectModel(model) {
    this.state.selectModel(model);
    if (this.state.state.isRunning) await this._loadActiveModel();
  }

  setMode(mode) {
    if (!interactionModes.includes(mode)) return;
    this.state.setMode(mode);
    this.transformController.setMode(mode);
  }

  async toggleRun() {
    if (this.state.state.isRunning) return this.stop();
    if (!this.state.state.activeModel) return;
    this.state.setRunning(true);
    this.sceneManager.start((delta) => this.transformController.update(delta));
    await this._loadActiveModel();
    try { await this.handTracker.start(); }
    catch (error) { this.homeView.toast(`${error.message} Você ainda pode usar os modos pela barra.`, 'error'); }
    if (this.voiceService.start()) this.homeView.showVoice('ouvindo comandos em português ou inglês');
  }

  stop() {
    this.handTracker.stop(); this.voiceService.stop(); this.homeView.showVoice(''); this.sceneManager.stop();
    this.state.setRunning(false);
  }

  onGesture(gesture) { if (this.state.state.isRunning) this.transformController.applyGesture(gesture); }

  async _loadActiveModel() {
    const model = this.state.state.activeModel;
    if (!model || this.loadedModelId === model.id) return;
    try {
      const gltf = await this.modelLoader.load(model.modelUrl);
      this.sceneManager.setModel(gltf.scene);
      this.transformController.attach(gltf.scene, gltf.animations);
      this.transformController.setMode(this.state.state.interactionMode);
      this.loadedModelId = model.id;
    } catch (error) {
      const fallback = this.sceneManager.createEmptyStateModel();
      this.transformController.attach(fallback);
      this.loadedModelId = model.id;
      this.homeView.toast(error.message, 'error');
    }
  }
}
