import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  constructor() { this.loader = new GLTFLoader(); }

  load(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, (gltf) => resolve(gltf), undefined, () => reject(new Error('Não foi possível carregar o modelo 3D selecionado.')));
    });
  }
}
