import type { Comparison } from "./comparison";
import { RequirementType } from "./requirement-type";

export interface HealthRequirement {
  readonly type: RequirementType.Health;
  readonly comparison: Comparison;
  readonly threshold: number;
}
