import type { CardPlayedEvent } from "./card-played-event";
import type { CombatantDefeatedEvent } from "./combatant-defeated-event";
import type { CooldownChangedEvent } from "./cooldown-changed-event";
import type { DamageDealtEvent } from "./damage-dealt-event";
import type { HealingDoneEvent } from "./healing-done-event";
import type { MatchEndedEvent } from "./match-ended-event";
import type { ModifierAppliedEvent } from "./modifier-applied-event";
import type { PlayerConcededEvent } from "./player-conceded-event";
import type { StatusAppliedEvent } from "./status-applied-event";
import type { StatusRemovedEvent } from "./status-removed-event";
import type { TurnEndedEvent } from "./turn-ended-event";

export type GameEvent =
  | TurnEndedEvent
  | PlayerConcededEvent
  | MatchEndedEvent
  | CardPlayedEvent
  | DamageDealtEvent
  | HealingDoneEvent
  | StatusAppliedEvent
  | StatusRemovedEvent
  | ModifierAppliedEvent
  | CooldownChangedEvent
  | CombatantDefeatedEvent;
