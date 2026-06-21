import type { CardDefinitionId } from "./ids";
import { RequirementType } from "./requirement-type";

export interface CardUsedRequirement {
  readonly type: RequirementType.CardUsed;
  readonly cardDefinitionIds: readonly CardDefinitionId[];
}
