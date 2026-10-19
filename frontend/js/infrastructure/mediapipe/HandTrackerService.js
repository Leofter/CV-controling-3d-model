import { GestureClassifier } from './GestureClassifier.js';

const HAND_CHAINS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [0, 9, 10, 11, 12],
  [0, 13, 14, 15, 16],
  [0, 17, 18, 19, 20],
  [5, 9, 13, 17, 0],
];
const FINGERTIP_INDICES = new Set([0, 4, 8, 12, 16, 20]);

export class HandTrackerService {
  constructor({ container, onGesture, classifier = new GestureClassifier() }) {
    this.container = container;
    this.onGesture = onGesture;
    this.classifier = classifier;
    this.video = null;
    this.canvas = null;
    this.badge = null;
    this.context = null;
    this.landmarker = null;
    this.stream = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.smoothingFactor = 0.45;
    this.smoothedHands = [];
    this._loop = this._loop.bind(this);
  }

  async start() {
    if (this.running) return;
    this._createOverlay();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
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
    this.smoothedHands = [];
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video?.remove();
    this.canvas?.remove();
    this.badge?.remove();
    this.video = null;
    this.canvas = null;
    this.badge = null;
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
    this.video.muted = true;
    this.video.playsInline = true;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hand-overlay';
    this.context = this.canvas.getContext('2d');
    this.badge = document.createElement('div');
    this.badge.className = 'camera-badge';
    this.badge.textContent = 'Webcam ativa · mostre a mão';
    this.container.append(this.video, this.canvas, this.badge);
  }

  _loop() {
    if (!this.running || !this.video || !this.landmarker) return;
    if (this.video.readyState >= 2 && this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      const projectedHands = this._smoothAndProject(result.landmarks || []);
      const gesture = this.classifier.classify(projectedHands);
      this._draw(gesture);
      this._updateBadge(gesture);
      this.onGesture(gesture);
    }
    requestAnimationFrame(this._loop);
  }

  _smoothAndProject(rawHands) {
    if (!rawHands.length) {
      this.smoothedHands = [];
      return [];
    }
    const videoParams = this._getVisibleVideoParameters();
    return rawHands.map((points, handIndex) => {
      const previous = this.smoothedHands[handIndex];
      const smoothed = points.map((point, index) => {
        const prev = previous?.[index] || point;
        const x = this.smoothingFactor * point.x + (1 - this.smoothingFactor) * prev.x;
        const y = this.smoothingFactor * point.y + (1 - this.smoothingFactor) * prev.y;
        const z = this.smoothingFactor * (point.z || 0) + (1 - this.smoothingFactor) * (prev.z || 0);
        if (!videoParams) {
          return { x, y, z, rawX: x, rawY: y, screenX: 1 - x, screenY: y };
        }
        const origX = x * videoParams.videoNaturalWidth;
        const origY = y * videoParams.videoNaturalHeight;
        const normX = (origX - videoParams.offsetX) / videoParams.visibleWidth;
        const normY = (origY - videoParams.offsetY) / videoParams.visibleHeight;
        return {
          x,
          y,
          z,
          rawX: x,
          rawY: y,
          screenX: 1 - normX,
          screenY: normY,
        };
      });
      this.smoothedHands[handIndex] = smoothed;
      return smoothed;
    });
  }

  _getVisibleVideoParameters() {
    if (!this.video || !this.canvas) return null;
    const vNatW = this.video.videoWidth;
    const vNatH = this.video.videoHeight;
    const rW = this.canvas.clientWidth;
    const rH = this.canvas.clientHeight;
    if (!vNatW || !vNatH || !rW || !rH) return null;
    const videoAR = vNatW / vNatH;
    const containerAR = rW / rH;
    if (videoAR > containerAR) {
      const scale = rH / vNatH;
      const scaledWidth = vNatW * scale;
      const croppedX = (scaledWidth - rW) / scale;
      return {
        offsetX: croppedX / 2,
        offsetY: 0,
        visibleWidth: vNatW - croppedX,
        visibleHeight: vNatH,
        videoNaturalWidth: vNatW,
        videoNaturalHeight: vNatH,
      };
    }
    const scale = rW / vNatW;
    const scaledHeight = vNatH * scale;
    const croppedY = (scaledHeight - rH) / scale;
    return {
      offsetX: 0,
      offsetY: croppedY / 2,
      visibleWidth: vNatW,
      visibleHeight: vNatH - croppedY,
      videoNaturalWidth: vNatW,
      videoNaturalHeight: vNatH,
    };
  }

  _updateBadge(gesture) {
    if (!this.badge) return;
    if (!gesture.hands.length) {
      this.badge.textContent = 'Webcam · aguardando mão';
      this.badge.dataset.state = 'idle';
    } else if (gesture.activeHands > 0) {
      this.badge.textContent = gesture.activeHands > 1 ? '2 mãos · pinça dupla ativa' : 'Mão detectada · pinça ativa';
      this.badge.dataset.state = 'pinching';
    } else {
      this.badge.textContent = `${gesture.hands.length > 1 ? '2 mãos detectadas' : 'Mão detectada'} · faça pinça`;
      this.badge.dataset.state = 'tracking';
    }
  }

  _draw(gesture) {
    if (!this.canvas || !this.context || !this.video.videoWidth) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.context.clearRect(0, 0, width, height);
    gesture.hands.forEach((hand, handIndex) => {
      const points = hand.landmarks;
      const isPinching = hand.isPinching;
      const strokeColor = isPinching ? '#00ffd5' : '#00ccff';
      const tipColor = isPinching ? '#cce86d' : (handIndex === 0 ? '#00e5ff' : '#7cff9b');

      this.context.save();
      this.context.strokeStyle = strokeColor;
      this.context.lineWidth = isPinching ? 3.5 : 2.5;
      this.context.lineCap = 'round';
      this.context.lineJoin = 'round';

      HAND_CHAINS.forEach((chain) => {
        this.context.beginPath();
        chain.forEach((pointIndex, step) => {
          const pt = points[pointIndex];
          const x = (pt.screenX ?? (1 - pt.x)) * width;
          const y = (pt.screenY ?? pt.y) * height;
          if (step === 0) this.context.moveTo(x, y);
          else this.context.lineTo(x, y);
        });
        this.context.stroke();
      });

      points.forEach((pt, idx) => {
        const x = (pt.screenX ?? (1 - pt.x)) * width;
        const y = (pt.screenY ?? pt.y) * height;
        const isTip = FINGERTIP_INDICES.has(idx);
        const radius = isTip ? (isPinching ? 7 : 5.5) : 3;
        this.context.beginPath();
        this.context.fillStyle = isTip ? tipColor : '#ecffd9';
        this.context.globalAlpha = isTip ? (isPinching ? 0.95 : 0.72) : 0.65;
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.fill();
      });

      if (isPinching) {
        const pinchX = hand.x * width;
        const pinchY = hand.y * height;
        this.context.globalAlpha = 1;
        this.context.strokeStyle = '#cce86d';
        this.context.lineWidth = 2.5;
        this.context.beginPath();
        this.context.arc(pinchX, pinchY, 14, 0, Math.PI * 2);
        this.context.stroke();
      }
      this.context.restore();
    });
  }
}
