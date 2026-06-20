import { SimulationError } from "./simulation-error";

export class InvalidActionError extends SimulationError {
  public static cardNotFound(): InvalidActionError {
    return new InvalidActionError("The referenced card does not exist.");
  }

  public static cardNotOwned(): InvalidActionError {
    return new InvalidActionError(
      "The card is not owned by the acting player.",
    );
  }

  public static cardOnCooldown(): InvalidActionError {
    return new InvalidActionError("The card cannot be used while on cooldown.");
  }

  public static requirementNotMet(): InvalidActionError {
    return new InvalidActionError("The ability requirement is not satisfied.");
  }

  private constructor(message: string) {
    super(message);
  }
}
