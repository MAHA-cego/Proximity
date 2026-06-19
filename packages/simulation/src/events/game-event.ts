import type { TurnEndedEvent } from "./turn-ended-event";
import type { PlayerConcededEvent } from "./player-conceded-event";
import type { MatchEndedEvent } from "./match-ended-event";

export type GameEvent = TurnEndedEvent | PlayerConcededEvent | MatchEndedEvent;
