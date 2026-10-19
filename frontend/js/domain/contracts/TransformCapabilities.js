/** Capability contracts keep input services independent from Three.js objects. */
export class IRotatable { rotateBy(_x, _y) { throw new Error('IRotatable.rotateBy must be implemented'); } }
export class IScalable { scaleTo(_value) { throw new Error('IScalable.scaleTo must be implemented'); } }
export class IDraggable { moveTo(_x, _y) { throw new Error('IDraggable.moveTo must be implemented'); } }
