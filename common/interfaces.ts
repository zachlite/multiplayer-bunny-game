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
  hidden?: true;
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
  COLLISION_START,
  COLLISION_END,
  COLLISION_ACTIVE
}

interface BaseMessage {
  subject: MessageType;
}

export interface InputMessage extends BaseMessage {
  input: Input;
}

export interface CollisionStartMessage extends BaseMessage {
  axisOfCollision: "x" | "y" | "z";
  entities: {
    [entityId: string]: {
      velocityBeforeCollision: Vec3;
      positionBeforeCollision: Vec3;
    };
  };
}

export interface CollisionEndMessage extends BaseMessage {
  entityIds: string[];
}

export interface CollisionActiveMessage extends BaseMessage {
  entityIds: string[];
  axisOfCollision: "x" | "y" | "z";
}

export type Message =
  | InputMessage
  | CollisionStartMessage
  | CollisionEndMessage
  | CollisionActiveMessage;

export interface Camera {
  position: Vec3;
  rotation: Vec3;
}
export interface State extends Array<Entity> {}
