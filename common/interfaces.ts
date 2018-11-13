export interface Input {
  left: boolean;
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

export interface Entity {
  id: string;
  type: EntityType;
  color: string;
  transform?: Transform;
  health?: Health;
  controllable?: Controllable;
  follow?: Follow;
}

export interface State extends Array<Entity> {}
