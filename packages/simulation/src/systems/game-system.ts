import type { ExecutionContext } from "../engine";

export interface GameSystem {
  execute(context: ExecutionContext): void;
}
