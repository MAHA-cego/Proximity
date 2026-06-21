import type { CardUsedRequirement } from "./card-used-requirement";
import type { HealthRequirement } from "./health-requirement";
import type { StatusRequirement } from "./status-requirement";

export type AbilityRequirement =
  | CardUsedRequirement
  | HealthRequirement
  | StatusRequirement;
