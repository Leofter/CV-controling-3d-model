export class GestureClassifier {
  constructor(pinchThreshold = 0.07) {
    this.pinchThreshold = pinchThreshold;
  }

  classify(landmarks = []) {
    const hands = landmarks.map((points, index) => {
      const thumb = points[4];
      const indexTip = points[8];
      const wrist = points[0];
      const dx = (thumb.rawX ?? thumb.x) - (indexTip.rawX ?? indexTip.x);
      const dy = (thumb.rawY ?? thumb.y) - (indexTip.rawY ?? indexTip.y);
      const distance = Math.hypot(dx, dy);
      const screenThumbX = thumb.screenX ?? (1 - thumb.x);
      const screenIndexX = indexTip.screenX ?? (1 - indexTip.x);
      const screenThumbY = thumb.screenY ?? thumb.y;
      const screenIndexY = indexTip.screenY ?? indexTip.y;
      return {
        id: index,
        x: (screenThumbX + screenIndexX) / 2,
        y: (screenThumbY + screenIndexY) / 2,
        wrist: {
          x: wrist.screenX ?? (1 - wrist.x),
          y: wrist.screenY ?? wrist.y,
          z: wrist.z,
        },
        pinchDistance: distance,
        isPinching: distance < this.pinchThreshold,
        landmarks: points,
      };
    });
    return { hands, activeHands: hands.filter((hand) => hand.isPinching).length };
  }
}
