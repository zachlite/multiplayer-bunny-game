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

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
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

export interface State extends Array<Entity> {}
