import { GestureClassifier } from './GestureClassifier.js';

export class HandTrackerService {
  constructor({ container, onGesture, classifier = new GestureClassifier() }) {
    this.container = container;
    this.onGesture = onGesture;
    this.classifier = classifier;
    this.video = null;
    this.canvas = null;
    this.context = null;
    this.landmarker = null;
    this.stream = null;
    this.running = false;
    this.lastVideoTime = -1;
    this._loop = this._loop.bind(this);
  }

  async start() {
    if (this.running) return;
    this._createOverlay();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      this.video.srcObject = this.stream;
      await this.video.play();
    } catch (error) {
      this.stop();
      throw new Error(`Não foi possível abrir a câmera: ${error.message || 'verifique a permissão do navegador.'}`);
    }
    try {
      this.landmarker = await this._createLandmarker();
      this.running = true;
      requestAnimationFrame(this._loop);
    } catch (error) {
      this.stop();
      throw new Error(`Não foi possível carregar o rastreamento de mãos. Verifique sua conexão e tente novamente. (${error.message || 'MediaPipe indisponível'})`);
    }
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video?.remove();
    this.canvas?.remove();
    this.video = null;
    this.canvas = null;
    this.context = null;
  }

  async _createLandmarker() {
    // Defer the external MediaPipe module until RUN so a CDN/network issue never
    // prevents the studio UI itself from rendering.
    const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm');
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    const options = {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'GPU' },
      runningMode: 'VIDEO', numHands: 2,
    };
    try { return await HandLandmarker.createFromOptions(vision, options); }
    catch (_) { return HandLandmarker.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
  }

  _createOverlay() {
    this.video = document.createElement('video');
    this.video.className = 'camera-preview';
    this.video.muted = true; this.video.playsInline = true;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hand-overlay';
    this.context = this.canvas.getContext('2d');
    this.container.append(this.video, this.canvas);
  }

  _loop() {
    if (!this.running || !this.video || !this.landmarker) return;
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      this._draw(result.landmarks || []);
      this.onGesture(this.classifier.classify(result.landmarks || []));
    }
    requestAnimationFrame(this._loop);
  }

  _draw(hands) {
    if (!this.canvas || !this.context || !this.video.videoWidth) return;
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    this.context.clearRect(0, 0, width, height);
    hands.forEach((points) => {
      this.context.strokeStyle = '#b8e986'; this.context.fillStyle = '#ecffd9'; this.context.lineWidth = 2;
      [[0,1,2,3,4],[0,5,6,7,8],[0,9,10,11,12],[0,13,14,15,16],[0,17,18,19,20],[5,9,13,17,0]].forEach((chain) => {
        this.context.beginPath(); chain.forEach((i, n) => { const x = (1 - points[i].x) * width; const y = points[i].y * height; n ? this.context.lineTo(x, y) : this.context.moveTo(x, y); }); this.context.stroke();
      });
      points.forEach((point) => { this.context.beginPath(); this.context.arc((1 - point.x) * width, point.y * height, 3, 0, Math.PI * 2); this.context.fill(); });
    });
  }
}
