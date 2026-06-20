import type { StatusType } from "./status-type";

export interface RuntimeStatus {
  readonly type: StatusType;
  readonly remainingDuration: number;
  readonly amount: number;
}
