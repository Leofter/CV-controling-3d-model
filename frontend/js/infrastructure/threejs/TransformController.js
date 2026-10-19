import * as THREE from 'three';
import { InteractionMode } from '../../domain/InteractionMode.js';

export class TransformController {
  constructor({ getWorldPlaneSize = () => ({ width: 5.2, height: 3.6 }) } = {}) {
    this.getWorldPlaneSize = getWorldPlaneSize;
    this.model = null;
    this.mode = InteractionMode.DRAG;
    this.initialPosition = new THREE.Vector3();
    this.initialRotation = new THREE.Euler();
    this.baseScale = 1;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.targetScale = 1;
    this.lastPrimary = null;
    this.grabStartHand = null;
    this.grabStartPosition = new THREE.Vector3();
    this.initialPinchSpan = null;
    this.initialScale = 1;
    this.mixer = null;
    this.actions = [];
    this.currentAnimation = 0;
    this.animationGestureActive = false;
    this.animationScrollAnchorY = null;
  }

  attach(model, animations = []) {
    this.model = model;
    this.initialPosition.copy(model.position);
    this.initialRotation.copy(model.rotation);
    this.baseScale = model.scale.x || 1;
    this.targetPosition.copy(model.position);
    this.targetRotation.copy(model.rotation);
    this.targetScale = this.baseScale;
    this._clearGestureSession();
    this.mixer = animations.length ? new THREE.AnimationMixer(model) : null;
    this.actions = this.mixer ? animations.map((clip) => this.mixer.clipAction(clip)) : [];
    if (this.actions.length) {
      this.actions[0].reset().play();
    }
  }

  setMode(mode) {
    this.mode = mode;
    this._clearGestureSession();
  }

  resetTransform() {
    if (!this.model) return;
    this.targetPosition.copy(this.initialPosition);
    this.targetRotation.copy(this.initialRotation);
    this.targetScale = this.baseScale;
    this._clearGestureSession();
  }

  _clearGestureSession() {
    this.lastPrimary = null;
    this.grabStartHand = null;
    this.initialPinchSpan = null;
    this.animationGestureActive = false;
    this.animationScrollAnchorY = null;
  }

  applyGesture(gesture) {
    if (!this.model) return;
    const pinched = gesture.hands.filter((hand) => hand.isPinching);
    if (this.mode === InteractionMode.SCALE) return this._scale(pinched);
    const hand = pinched[0];
    if (!hand) {
      this._clearGestureSession();
      return;
    }

    if (this.mode === InteractionMode.DRAG) {
      const plane = this.getWorldPlaneSize(this.targetPosition.z);
      if (!this.grabStartHand) {
        this.grabStartHand = { x: hand.x, y: hand.y };
        this.grabStartPosition.copy(this.targetPosition);
      } else {
        const deltaX = (hand.x - this.grabStartHand.x) * plane.width;
        const deltaY = (this.grabStartHand.y - hand.y) * plane.height;
        const maxX = plane.width * 0.46;
        const maxY = plane.height * 0.46;
        this.targetPosition.set(
          THREE.MathUtils.clamp(this.grabStartPosition.x + deltaX, -maxX, maxX),
          THREE.MathUtils.clamp(this.grabStartPosition.y + deltaY, -maxY, maxY),
          this.grabStartPosition.z,
        );
      }
    } else if (this.mode === InteractionMode.ROTATE) {
      if (this.lastPrimary) {
        this.targetRotation.y += (hand.x - this.lastPrimary.x) * 7.2;
        this.targetRotation.x = THREE.MathUtils.clamp(
          this.targetRotation.x + (hand.y - this.lastPrimary.y) * 4.5,
          -Math.PI * 0.48,
          Math.PI * 0.48,
        );
      }
    } else if (this.mode === InteractionMode.ANIMATE) {
      if (!this.animationGestureActive) {
        this._playNextAnimation(1);
        this.animationGestureActive = true;
        this.animationScrollAnchorY = hand.y;
      } else if (this.animationScrollAnchorY !== null && Math.abs(hand.y - this.animationScrollAnchorY) > 0.085) {
        const direction = hand.y < this.animationScrollAnchorY ? 1 : -1;
        this._playNextAnimation(direction);
        this.animationScrollAnchorY = hand.y;
      }
    }
    this.lastPrimary = hand;
  }

  _scale(pinched) {
    if (pinched.length < 2) {
      this.initialPinchSpan = null;
      return;
    }
    const span = Math.max(0.02, Math.hypot(pinched[0].x - pinched[1].x, pinched[0].y - pinched[1].y));
    if (!this.initialPinchSpan) {
      this.initialPinchSpan = span;
      this.initialScale = this.targetScale;
      return;
    }
    const scaleRatio = span / this.initialPinchSpan;
    this.targetScale = THREE.MathUtils.clamp(this.initialScale * scaleRatio, 0.25, 3.6);
  }

  _playNextAnimation(step = 1) {
    if (!this.actions.length) {
      this.targetRotation.y += step * (Math.PI / 2);
      return;
    }
    this.actions.forEach((action) => action.fadeOut(0.12));
    this.currentAnimation = (this.currentAnimation + step + this.actions.length) % this.actions.length;
    const action = this.actions[this.currentAnimation];
    action.reset().fadeIn(0.16).play();
  }

  update(delta) {
    if (!this.model) return;
    const smoothing = 1 - Math.exp(-14 * delta);
    this.model.position.lerp(this.targetPosition, smoothing);
    this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, this.targetRotation.x, smoothing);
    this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, this.targetRotation.y, smoothing);
    const scale = THREE.MathUtils.lerp(this.model.scale.x, this.targetScale, smoothing);
    this.model.scale.setScalar(scale);
    this.mixer?.update(delta);
  }
}
