import * as THREE from 'three';
import { VisualizationMode } from '../../domain/InteractionMode.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.studioBackground = new THREE.Color('#edf1e9');
    this.scene.background = this.studioBackground;
    this.visualizationMode = VisualizationMode.STUDIO;
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    this.camera.position.set(0, 0.2, 6);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = 'three-canvas';
    container.append(this.renderer.domElement);
    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);
    this.ground = null;
    this._clock = new THREE.Clock();
    this._frameCallback = () => {};
    this._isRendering = false;
    this._setupLights();
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(this.container);
    }
    this._resize();
  }

  _setupLights() {
    this.scene.add(new THREE.HemisphereLight('#f8fbf4', '#3d4b3a', 2.2));
    const key = new THREE.DirectionalLight('#fff7df', 3.2);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight('#9dc3a0', 1.6);
    fill.position.set(-4, 1, 2);
    this.scene.add(fill);
    this.ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.ShadowMaterial({ color: '#335333', opacity: 0.16 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -1.45;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  setVisualizationMode(mode) {
    this.visualizationMode = mode;
    const isCameraAR = mode === VisualizationMode.CAMERA_AR;
    this.scene.background = isCameraAR ? null : this.studioBackground;
    if (this.ground) {
      this.ground.visible = !isCameraAR;
    }
    this._resize();
    if (!this._isRendering) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getWorldPlaneSize(targetZ = 0) {
    const distance = Math.max(0.5, this.camera.position.z - targetZ);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * (this.camera.aspect || 1);
    return { width, height };
  }

  setModel(model) {
    this.clearModel();
    this.modelRoot.add(model);
    model.traverse((node) => {
      if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });
    this.renderer.render(this.scene, this.camera);
  }

  clearModel() {
    while (this.modelRoot.children.length) this.modelRoot.remove(this.modelRoot.children[0]);
  }

  createEmptyStateModel() {
    const geometry = new THREE.IcosahedronGeometry(1.05, 4);
    const material = new THREE.MeshStandardMaterial({ color: '#6d965a', roughness: 0.62, metalness: 0.02 });
    const fallback = new THREE.Mesh(geometry, material);
    fallback.scale.set(0.88, 1.15, 0.88);
    this.setModel(fallback);
    return fallback;
  }

  start(onFrame) {
    this._frameCallback = onFrame || (() => {});
    if (this._isRendering) return;
    this._isRendering = true;
    this._clock.start();
    this.renderer.setAnimationLoop(() => {
      this._frameCallback(this._clock.getDelta());
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() { this._isRendering = false; this.renderer.setAnimationLoop(null); }
  dispose() {
    this.stop();
    window.removeEventListener('resize', this._resize);
    this._resizeObserver?.disconnect();
    this.renderer.dispose();
  }

  _resize() {
    const { clientWidth: width, clientHeight: height } = this.container;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (this._isRendering) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
