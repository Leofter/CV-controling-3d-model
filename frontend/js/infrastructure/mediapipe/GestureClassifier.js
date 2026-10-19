export class GestureClassifier {
  constructor(pinchThreshold = 0.065) { this.pinchThreshold = pinchThreshold; }

  classify(landmarks = []) {
    const hands = landmarks.map((points, index) => {
      const thumb = points[4];
      const indexTip = points[8];
      const wrist = points[0];
      const distance = Math.hypot(thumb.x - indexTip.x, thumb.y - indexTip.y);
      return {
        id: index,
        x: (thumb.x + indexTip.x) / 2,
        y: (thumb.y + indexTip.y) / 2,
        wrist,
        pinchDistance: distance,
        isPinching: distance < this.pinchThreshold,
        landmarks: points,
      };
    });
    return { hands, activeHands: hands.filter((hand) => hand.isPinching).length };
  }
}
