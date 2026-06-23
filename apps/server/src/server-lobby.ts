import { randomBytes } from "node:crypto";
import {
  Team,
  type CardDefinitionId,
  type CombatantId,
} from "@proximity/simulation";
import { createMatch } from "./match-store.js";
import { CARD_REGISTRY } from "./card-registry.js";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = randomBytes(4);
  let code = "";
  for (const byte of bytes) {
    code += chars[byte % 26];
  }
  return code;
}

export type LobbyPhase = "waiting" | "both-joined" | "started";

interface LobbyParticipant {
  playerId: string;
  combatantId: CombatantId;
  deckCardIds: readonly CardDefinitionId[] | null;
}

interface LobbyEntry {
  code: string;
  phase: LobbyPhase;
  host: LobbyParticipant;
  guest: LobbyParticipant | null;
  matchId: string | null;
}

const store = new Map<string, LobbyEntry>();

export function createLobby(): { code: string; playerId: string } {
  const code = generateCode();
  store.set(code, {
    code,
    phase: "waiting",
    host: {
      playerId: "host",
      combatantId: "player-1" as CombatantId,
      deckCardIds: null,
    },
    guest: null,
    matchId: null,
  });
  return { code, playerId: "host" };
}

export function joinLobby(code: string): { playerId: string } | null {
  const lobby = store.get(code);
  if (!lobby || lobby.guest !== null || lobby.phase !== "waiting") return null;
  lobby.guest = {
    playerId: "guest",
    combatantId: "player-2" as CombatantId,
    deckCardIds: null,
  };
  lobby.phase = "both-joined";
  return { playerId: "guest" };
}

export function submitDeck(
  code: string,
  playerId: string,
  rawCardIds: string[],
): { matchId: string | null; phase: LobbyPhase } | null {
  const lobby = store.get(code);
  if (!lobby) return null;

  const deckCardIds = rawCardIds.filter((id) =>
    CARD_REGISTRY.has(id as CardDefinitionId),
  ) as CardDefinitionId[];

  if (lobby.host.playerId === playerId) {
    lobby.host = { ...lobby.host, deckCardIds };
  } else if (lobby.guest?.playerId === playerId) {
    lobby.guest = { ...lobby.guest, deckCardIds };
  } else {
    return null;
  }

  if (lobby.host.deckCardIds && lobby.guest?.deckCardIds) {
    startMatch(lobby);
  }

  return { matchId: lobby.matchId, phase: lobby.phase };
}

function startMatch(lobby: LobbyEntry): void {
  const { host, guest } = lobby;
  if (!host.deckCardIds || !guest?.deckCardIds) return;

  const matchId = `${lobby.code}-${Date.now()}`;

  const allCardIds = [
    ...new Set([...host.deckCardIds, ...guest.deckCardIds]),
  ] as CardDefinitionId[];

  const cardDefinitions = allCardIds
    .filter((id) => CARD_REGISTRY.has(id))
    .map((id) => [id, CARD_REGISTRY.get(id)!] as const);

  createMatch(
    {
      matchId,
      playerAssignments: [
        { playerId: host.playerId, combatantId: host.combatantId },
        { playerId: guest.playerId, combatantId: guest.combatantId },
      ],
      definition: {
        combatants: [
          {
            combatant: {
              id: host.combatantId,
              team: Team.One,
              maxHealth: 100,
            },
            loadout: { cardDefinitionIds: host.deckCardIds },
          },
          {
            combatant: {
              id: guest.combatantId,
              team: Team.Two,
              maxHealth: 100,
            },
            loadout: { cardDefinitionIds: guest.deckCardIds },
          },
        ],
        cardDefinitions,
      },
    },
    lobby.code,
  );

  lobby.matchId = matchId;
  lobby.phase = "started";
}

export interface LobbyStateView {
  code: string;
  phase: LobbyPhase;
  guestJoined: boolean;
  playerReady: boolean;
  opponentReady: boolean;
  matchId: string | null;
}

export function resetForRematch(code: string): boolean {
  const lobby = store.get(code);
  if (!lobby || lobby.phase !== "started") return false;
  lobby.host = { ...lobby.host, deckCardIds: null };
  if (lobby.guest) {
    lobby.guest = { ...lobby.guest, deckCardIds: null };
  }
  lobby.phase = "both-joined";
  lobby.matchId = null;
  return true;
}

export function getLobbyState(
  code: string,
  playerId: string,
): LobbyStateView | null {
  const lobby = store.get(code);
  if (!lobby) return null;

  const isHost = lobby.host.playerId === playerId;
  const self = isHost ? lobby.host : lobby.guest;
  const opponent = isHost ? lobby.guest : lobby.host;

  if (!self) return null;

  return {
    code: lobby.code,
    phase: lobby.phase,
    guestJoined: lobby.guest !== null,
    playerReady: self.deckCardIds !== null,
    opponentReady:
      opponent !== null &&
      opponent !== undefined &&
      opponent.deckCardIds !== null,
    matchId: lobby.matchId,
  };
}
