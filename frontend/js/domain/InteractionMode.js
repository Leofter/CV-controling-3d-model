export const InteractionMode = Object.freeze({
  DRAG: 'drag',
  ROTATE: 'rotate',
  SCALE: 'scale',
  ANIMATE: 'animate',
});

export const interactionModes = Object.freeze(Object.values(InteractionMode));

export const modeLabels = Object.freeze({
  [InteractionMode.DRAG]: 'Arrastar',
  [InteractionMode.ROTATE]: 'Rotação',
  [InteractionMode.SCALE]: 'Escala',
  [InteractionMode.ANIMATE]: 'Animar',
});

export const VisualizationMode = Object.freeze({
  STUDIO: 'studio',
  CAMERA_AR: 'camera',
});

export const visualizationModes = Object.freeze(Object.values(VisualizationMode));

export const visualizationLabels = Object.freeze({
  [VisualizationMode.STUDIO]: 'Estúdio + Webcam',
  [VisualizationMode.CAMERA_AR]: 'Câmera Real (AR)',
});
