import { SimulationError } from "./simulation-error";

export class InvalidStateError extends SimulationError {
  public static activePlayerMissing(): InvalidStateError {
    return new InvalidStateError("Active player not found in game state.");
  }

  private constructor(message: string) {
    super(message);
  }
}
