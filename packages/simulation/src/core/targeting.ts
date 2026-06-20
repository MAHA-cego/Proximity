import type { CardDefinitionId } from "./ids";
import type { TargetingType } from "./targeting-type";

export type Targeting =
  | { readonly type: TargetingType.None }
  | { readonly type: TargetingType.Self }
  | { readonly type: TargetingType.SingleEnemy }
  | {
      readonly type: TargetingType.Card;
      readonly cardDefinitionId: CardDefinitionId;
    };
