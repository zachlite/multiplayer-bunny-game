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
  lastPosition?: Vec3;
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

export interface BoundingBox {
  offset: Vec3;
  activeCollision: boolean;
  yOffset: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  mesh?: Mesh;
  body?: PhysicalBody;
  boundingBox?: BoundingBox;
}

export enum MeshTypes {
  BUNNY,
  TEAPOT,
  GROUND,
  CUBE,
  BOUNDING_BOX
}

export enum MessageType {
  INPUT,
  GRAVITY,
  COLLISION
}

interface BaseMessage {
  subject: MessageType;
}

export interface InputMessage extends BaseMessage {
  input: Input;
}

export interface CollisionMessage extends BaseMessage {
  axisOfCollision: "x" | "y" | "z";
  entities: {
    [entityId: string]: {
      velocityBeforeCollision: Vec3;
      positionBeforeCollision: Vec3;
    };
  };
}

export type Message = InputMessage | CollisionMessage;

export interface Camera {
  position: Vec3;
  rotation: Vec3;
}
export interface State extends Array<Entity> {}
