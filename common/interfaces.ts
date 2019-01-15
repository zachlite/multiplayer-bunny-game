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

interface Mesh {
  meshType: MeshTypes;
}

interface PhysicalBody {
  // mass: number; // kg
  useGravity: boolean;
  velocity: Vec3;
  transform: Transform;
}

export interface Collider {
  position: Vec3;
  scale: Vec3;
  isTrigger: boolean;
  isStatic: boolean;
  debug__activeCollision: boolean;
  debug__drawOutline: boolean;
}

export interface Coin {
  timeSinceDeactivation: number;
}

export interface Timer {
  lastTime: number;
  timeRemaining: number;
}

export interface SceneManager {
  currentScene: "GAME" | "GAME_OVER";
}

export interface Entity {
  id: string;
  isActive: boolean;
  type?: "PLAYER" | "CUBE" | "COIN" | "TIMER" | "SCENE_MANAGER";
  mesh?: Mesh;
  body?: PhysicalBody;
  collider?: Collider;
  score?: number;
  coin?: Coin;
  color?: number[];
  timer?: Timer;
  sceneManager?: SceneManager;
}

export enum MeshTypes {
  BUNNY,
  TEAPOT,
  GROUND,
  CUBE,
  BOUNDING_BOX,
  TRIGGER
}

export enum MessageType {
  INPUT,
  GRAVITY,
  COLLISION_START,
  COLLISION_END,
  COLLISION_ACTIVE,
  TRIGGER_ACTIVE,
  SCENE_TRANSITION
}

interface BaseMessage {
  subject: MessageType;
}

export interface InputMessage extends BaseMessage {
  input: Input;
  clientId: string;
}

export interface CollisionStartMessage extends BaseMessage {
  axisOfCollision: "x" | "y" | "z";
  entityIds: string[];
}

export interface CollisionEndMessage extends BaseMessage {
  entityIds: string[];
}

export interface CollisionActiveMessage extends BaseMessage {
  entityIds: string[];
  axisOfCollision: "x" | "y" | "z";
}

export interface TriggerActiveMessage extends BaseMessage {
  triggerId: string;
  entityId: string;
}

export interface SceneTransitionMessage extends BaseMessage {
  scene: "GAME" | "GAME_OVER";
}

export type Message =
  | InputMessage
  | CollisionStartMessage
  | CollisionEndMessage
  | CollisionActiveMessage
  | TriggerActiveMessage
  | SceneTransitionMessage;

export interface Camera {
  position: Vec3;
  rotation: Vec3;
}
export interface State extends Array<Entity> {}
