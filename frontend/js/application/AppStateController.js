import { InteractionMode, VisualizationMode } from '../domain/InteractionMode.js';

export class AppStateController {
  constructor() {
    this.state = Object.freeze({
      activeModel: null,
      interactionMode: InteractionMode.DRAG,
      visualizationMode: VisualizationMode.STUDIO,
      sidebarCollapsed: false,
      isRunning: false,
      models: [],
    });
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  setModels(models) {
    const selected = this.state.activeModel && models.find((model) => model.id === this.state.activeModel.id);
    this._update({ models, activeModel: selected || models[0] || null });
  }

  selectModel(model) { this._update({ activeModel: model }); }
  setMode(interactionMode) { this._update({ interactionMode }); }
  setVisualizationMode(visualizationMode) { this._update({ visualizationMode }); }
  setSidebarCollapsed(sidebarCollapsed) { this._update({ sidebarCollapsed }); }
  setRunning(isRunning) {
    this._update({
      isRunning,
      sidebarCollapsed: isRunning ? true : false,
    });
  }

  _update(patch) {
    this.state = Object.freeze({ ...this.state, ...patch });
    this.listeners.forEach((listener) => listener(this.state));
  }
}
