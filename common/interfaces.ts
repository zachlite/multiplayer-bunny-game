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

export function initState(): State {
  const player: Entity = {
    id: "player",
    color: "blue",
    type: EntityType.PLAYER,
    transform: { x: 0, y: 0, width: 20, height: 20 },
    health: { amount: 100 },
    controllable: { active: true }
  };

  const enemy: Entity = {
    id: "enemy",
    color: "red",
    type: EntityType.ENEMY,
    follow: { destination: { x: player.transform.x, y: player.transform.y } },
    transform: { x: 100, y: 0, width: 20, height: 20 }
  };

  return [player, enemy];
}
