import type { GameAction } from "../actions";
import type { MatchDefinition } from "../core";
import type { GameState } from "../state";

import { SystemRegistry } from "../systems";

import { ExecutionContext } from "./execution-context";
import type { EngineResult } from "./engine-result";

export class Engine {
  public constructor(private readonly registry: SystemRegistry) {}

  public executeAction(
    state: GameState,
    action: GameAction,
    definition: MatchDefinition,
  ): EngineResult {
    const context = new ExecutionContext(state, action, definition);

    this.registry.execute(context);

    return {
      state: context.state,
      events: context.getEvents(),
    };
  }
}
