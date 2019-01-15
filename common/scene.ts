import { State } from "./interfaces";

export function getCurrentScene(state: State) {
  return state.find(e => e.type === "SCENE_MANAGER").sceneManager.currentScene;
}
