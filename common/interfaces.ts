export interface Input {
  flap: boolean;
  forward: boolean;
  left: boolean;
  back: boolean;
  right: boolean;
}

export interface InputRequest {
  clientId: string;
  frame: number;
  input: Input;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

interface Health {
  amount: number;
}

interface Controllable {
  active: true;
}

interface Follow {
  destination: { x: number; y: number };
}

export enum EntityType {
  PLAYER,
  ENEMY
}

interface Physics {
  mass: number; // kg
  velocity: { x: number; y: number };
}

export interface Entity {
  id: string;
  type: EntityType;
  transform?: Transform;
  health?: Health;
  controllable?: Controllable;
  physics?: Physics;
  follow?: Follow;
}

export interface Camera {
  position: Vec3;
  rotation: Vec3;
}
export interface State extends Array<Entity> {}
