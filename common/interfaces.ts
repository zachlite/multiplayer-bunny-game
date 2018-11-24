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

export enum EntityType {
  PLAYER,
  GROUND,
  CUBE
}

interface Mesh {
  meshType: MeshTypes;
}

interface PhysicalBody {
  // mass: number; // kg
  velocity: Vec3;
  transform: Transform;
}

export interface Entity {
  id: string;
  type: EntityType;
  mesh?: Mesh;
  body?: PhysicalBody;
}

export enum MeshTypes {
  BUNNY,
  TEAPOT,
  GROUND,
  CUBE
}

export interface Camera {
  position: Vec3;
  rotation: Vec3;
}
export interface State extends Array<Entity> {}
