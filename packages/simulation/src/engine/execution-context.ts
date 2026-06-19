import type { GameAction } from "../actions";
import type { MatchDefinition } from "../core";
import type { GameEvent } from "../events";
import type { GameState } from "../state";

import { EventCollector } from "./event-collector";

export class ExecutionContext {
  private currentState: GameState;

  private readonly collector = new EventCollector();

  public constructor(
    initialState: GameState,
    public readonly action: GameAction,
    public readonly definition: MatchDefinition,
  ) {
    this.currentState = initialState;
  }

  public get state(): GameState {
    return this.currentState;
  }

  public replaceState(state: GameState): void {
    this.currentState = state;
  }

  public emit(event: GameEvent): void {
    this.collector.add(event);
  }

  public getEvents(): readonly GameEvent[] {
    return this.collector.toArray();
  }
}
