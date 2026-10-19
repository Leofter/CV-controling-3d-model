import { ModelMetadata } from '../../domain/ModelMetadata.js';

export class AgroBackendClient {
  constructor(baseUrl = new URLSearchParams(window.location.search).get('api') || (window.location.port === '8080' ? '' : 'http://localhost:8080')) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async listModels() {
    const response = await fetch(`${this.baseUrl}/api/models`);
    if (!response.ok) throw new Error('Não foi possível abrir o catálogo de modelos.');
    return (await response.json()).map((model) => this._toMetadata(model));
  }

  async uploadModel({ file, name, category }) {
    const body = new FormData(); body.append('file', file); body.append('name', name); body.append('category', category);
    return this._toMetadata(await this._post('/api/models/upload-3d', body));
  }

  async generateFromImages({ name, category, images }) {
    const body = new FormData(); body.append('name', name); body.append('category', category);
    Object.entries(images).forEach(([angle, file]) => { if (file) body.append(angle, file); });
    return this._toMetadata(await this._post('/api/models/generate-from-images', body));
  }

  assetUrl(relativeUrl) {
    if (!relativeUrl) return null;
    return relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`;
  }

  async _post(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, { method: 'POST', body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || 'A operação não pôde ser concluída.');
    return payload;
  }

  _toMetadata(payload) {
    return ModelMetadata.fromApi({ ...payload, model_url: this.assetUrl(payload.model_url), thumbnail_url: this.assetUrl(payload.thumbnail_url) });
  }
}
