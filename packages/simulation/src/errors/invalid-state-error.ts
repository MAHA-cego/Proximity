import { SimulationError } from "./simulation-error";

export class InvalidStateError extends SimulationError {
  public static activePlayerMissing(): InvalidStateError {
    return new InvalidStateError("Active player not found in game state.");
  }

  public static winnerNotFound(): InvalidStateError {
    return new InvalidStateError("Unable to determine the winning combatant.");
  }

  private constructor(message: string) {
    super(message);
  }
}
