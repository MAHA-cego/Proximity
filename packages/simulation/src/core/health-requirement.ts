import type { Comparison } from "./comparison";
import { RequirementType } from "./requirement-type";
import type { RequirementSubject } from "./requirement-subject";

export interface HealthRequirement {
  readonly type: RequirementType.Health;
  readonly comparison: Comparison;
  readonly threshold: number;
  readonly subject?: RequirementSubject;
}
