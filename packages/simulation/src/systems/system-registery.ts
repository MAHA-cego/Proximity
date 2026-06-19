import type { ExecutionContext } from "../engine";

import type { GameSystem } from "./game-system";

export class SystemRegistry {
  public constructor(private readonly systems: readonly GameSystem[]) {}

  public execute(context: ExecutionContext): void {
    for (const system of this.systems) {
      system.execute(context);
    }
  }
}
