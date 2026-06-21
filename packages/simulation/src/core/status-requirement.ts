import { RequirementType } from "./requirement-type";
import type { RequirementSubject } from "./requirement-subject";
import type { StatusType } from "./status-type";

export interface StatusRequirement {
  readonly type: RequirementType.Status;
  readonly statusType: StatusType;
  readonly subject: RequirementSubject;
}
