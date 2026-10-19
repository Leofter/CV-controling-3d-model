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
