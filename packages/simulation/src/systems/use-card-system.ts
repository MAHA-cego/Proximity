import { ActionType } from "../actions";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class UseCardSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.UseCard) {
      return;
    }
  }
}
