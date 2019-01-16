import * as _ from "lodash";

import { State, InputRequest } from "../common/interfaces";
import { initialState } from "../common/initialState";
import { PLAYERS_PER_PARTY } from "../common/constants";

export interface Party {
  id: string;
  partySize: number;
  state: State;
  clientBuffer: InputRequest[];
  clientSocketIds: {
    [id: string]: string;
  };
}

function createParty(): Party {
  return {
    id: _.uniqueId("party_"),
    state: [...initialState],
    partySize: 0,
    clientBuffer: [],
    clientSocketIds: {}
  };
}

function addClientToParty(party: Party, socket, clientId: string): Party {
  return {
    ...party,
    partySize: party.partySize + 1,
    clientSocketIds: {
      ...party.clientSocketIds,
      [socket.id]: clientId
    }
  };
}

export function PartyManager() {
  let parties: Party[] = [];

  function updateParties(updater) {
    parties = parties.map(party => updater(party));
  }

  function broadcastUpdates(broadcaster) {
    parties
      .filter(party => party.partySize > 0)
      .forEach(party => {
        broadcaster(party);
      });
  }

  function removeClientFromParty(party: Party, socket) {
    party.state = party.state.filter(
      e => e.id !== party.clientSocketIds[socket.id]
    );

    socket.leave(party.id);

    delete party.clientSocketIds[socket.id];
    party.partySize -= 1;

    if (party.partySize === 0) {
      parties = parties.filter(p => p.id !== party.id);
    }
  }

  function joinAvailableParty(socket, clientId) {
    const availableParty = parties.find(
      party =>
        party.partySize < PLAYERS_PER_PARTY &&
        party.state.find(e => e.type === "SCENE_MANAGER").sceneManager
          .currentScene === "LOBBY"
    );

    const party = availableParty ? availableParty : createParty();
    const partyWithClient = addClientToParty(party, socket, clientId);

    parties = availableParty
      ? parties.map(p => (p.id === party.id ? partyWithClient : p))
      : [...parties, partyWithClient];

    socket.join(partyWithClient.id);
    return partyWithClient;
  }

  function findParty(socket) {
    return parties.find(
      party => party.clientSocketIds[socket.id] !== undefined
    );
  }

  return {
    updateParties,
    broadcastUpdates,
    removeClientFromParty,
    joinAvailableParty,
    findParty
  };
}
