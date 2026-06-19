import type { ExecutionContext } from "../engine";

import type { GameSystem } from "./game-system";

export class TurnSystem implements GameSystem {
  public execute(_context: ExecutionContext): void {}
}
