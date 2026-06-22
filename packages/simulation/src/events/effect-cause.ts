import type { CardDefinitionId, StatusType } from "../core";

export type EffectCause =
  | { readonly kind: "card"; readonly cardId: CardDefinitionId }
  | { readonly kind: "status"; readonly statusType: StatusType };
