import { SimulationError } from "./simulation-error";

export class IllegalActionError extends SimulationError {
  public static notActivePlayer(): IllegalActionError {
    return new IllegalActionError(
      "Only the active player may perform this action.",
    );
  }

  public static matchCompleted(): IllegalActionError {
    return new IllegalActionError("Cannot end the turn of a completed match.");
  }

  public static cardNotFound(): IllegalActionError {
    return new IllegalActionError("The referenced card does not exist.");
  }

  public static cardNotOwned(): IllegalActionError {
    return new IllegalActionError(
      "The card is not owned by the acting player.",
    );
  }

  public static cardOnCooldown(): IllegalActionError {
    return new IllegalActionError("The card cannot be used while on cooldown.");
  }

  private constructor(message: string) {
    super(message);
  }
}
