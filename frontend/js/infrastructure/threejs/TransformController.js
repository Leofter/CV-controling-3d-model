import * as THREE from 'three';
import { InteractionMode } from '../../domain/InteractionMode.js';

export class TransformController {
  constructor() {
    this.model = null;
    this.mode = InteractionMode.DRAG;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.targetScale = 1;
    this.lastPrimary = null;
    this.initialPinchSpan = null;
    this.initialScale = 1;
    this.mixer = null;
    this.actions = [];
    this.currentAnimation = 0;
    this.animationGestureActive = false;
  }

  attach(model, animations = []) {
    this.model = model;
    this.targetPosition.copy(model.position);
    this.targetRotation.copy(model.rotation);
    this.targetScale = model.scale.x;
    this.lastPrimary = null;
    this.initialPinchSpan = null;
    this.animationGestureActive = false;
    this.mixer = animations.length ? new THREE.AnimationMixer(model) : null;
    this.actions = this.mixer ? animations.map((clip) => this.mixer.clipAction(clip)) : [];
  }

  setMode(mode) {
    this.mode = mode;
    this.lastPrimary = null;
    this.initialPinchSpan = null;
    this.animationGestureActive = false;
  }

  applyGesture(gesture) {
    if (!this.model) return;
    const pinched = gesture.hands.filter((hand) => hand.isPinching);
    if (this.mode === InteractionMode.SCALE) return this._scale(pinched);
    const hand = pinched[0];
    if (!hand) { this.lastPrimary = null; this.animationGestureActive = false; return; }
    if (this.mode === InteractionMode.DRAG) {
      this.targetPosition.set((hand.x - 0.5) * 3.5, (0.5 - hand.y) * 2.7, 0);
    } else if (this.mode === InteractionMode.ROTATE) {
      if (this.lastPrimary) {
        this.targetRotation.y += (hand.x - this.lastPrimary.x) * 7.5;
        this.targetRotation.x += (hand.y - this.lastPrimary.y) * 4;
      }
    } else if (this.mode === InteractionMode.ANIMATE) {
      if (!this.animationGestureActive) this._playNextAnimation();
      this.animationGestureActive = true;
    }
    this.lastPrimary = hand;
  }

  _scale(pinched) {
    if (pinched.length < 2) { this.initialPinchSpan = null; return; }
    const span = Math.hypot(pinched[0].x - pinched[1].x, pinched[0].y - pinched[1].y);
    if (!this.initialPinchSpan) { this.initialPinchSpan = span; this.initialScale = this.targetScale; return; }
    this.targetScale = THREE.MathUtils.clamp(this.initialScale * (span / this.initialPinchSpan), 0.25, 3.2);
  }

  _playNextAnimation() {
    if (!this.actions.length) {
      // Procedural/uploads without clips still have a useful animate interaction.
      this.targetRotation.y += Math.PI / 2;
      return;
    }
    const action = this.actions[this.currentAnimation % this.actions.length];
    action.reset().fadeIn(0.16).play();
    this.currentAnimation += 1;
  }

  update(delta) {
    if (!this.model) return;
    const smoothing = 1 - Math.exp(-10 * delta);
    this.model.position.lerp(this.targetPosition, smoothing);
    this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, this.targetRotation.x, smoothing);
    this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, this.targetRotation.y, smoothing);
    const scale = THREE.MathUtils.lerp(this.model.scale.x, this.targetScale, smoothing);
    this.model.scale.setScalar(scale);
    this.mixer?.update(delta);
  }
}
