import { SimulationError } from "./simulation-error";

export class IllegalActionError extends SimulationError {
  public static notActivePlayer(): IllegalActionError {
    return new IllegalActionError(
      "Only the active player may end the current turn.",
    );
  }

  public static matchCompleted(): IllegalActionError {
    return new IllegalActionError("Cannot end the turn of a completed match.");
  }

  private constructor(message: string) {
    super(message);
  }
}
