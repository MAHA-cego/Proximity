import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  type CardAbility,
  type CardEffect,
  type DamageEffect,
  EffectType,
  type Targeting,
  TargetingType,
} from "../src";

describe("AbilityTrigger", () => {
  it("has OnUse value", () => {
    expect(AbilityTrigger.OnUse).toBe("ON_USE");
  });

  it("has OnTurnStart value", () => {
    expect(AbilityTrigger.OnTurnStart).toBe("ON_TURN_START");
  });

  it("has Passive value", () => {
    expect(AbilityTrigger.Passive).toBe("PASSIVE");
  });
});

describe("TargetingType", () => {
  it("has None value", () => {
    expect(TargetingType.None).toBe("NONE");
  });

  it("has Self value", () => {
    expect(TargetingType.Self).toBe("SELF");
  });

  it("has SingleEnemy value", () => {
    expect(TargetingType.SingleEnemy).toBe("SINGLE_ENEMY");
  });
});

describe("EffectType", () => {
  it("has Damage value", () => {
    expect(EffectType.Damage).toBe("DAMAGE");
  });

  it("has Heal value", () => {
    expect(EffectType.Heal).toBe("HEAL");
  });
});

describe("DamageEffect", () => {
  it("can be constructed with type and amount", () => {
    const effect: DamageEffect = {
      type: EffectType.Damage,
      amount: 5,
    };

    expect(effect.type).toBe(EffectType.Damage);
    expect(effect.amount).toBe(5);
  });
});

describe("CardAbility", () => {
  it("can be constructed with trigger, targeting and effects", () => {
    const targeting: Targeting = { type: TargetingType.SingleEnemy };

    const effect: CardEffect = {
      type: EffectType.Damage,
      amount: 3,
    };

    const ability: CardAbility = {
      trigger: AbilityTrigger.OnUse,
      targeting,
      effects: [effect],
    };

    expect(ability.trigger).toBe(AbilityTrigger.OnUse);
    expect(ability.targeting.type).toBe(TargetingType.SingleEnemy);
    expect(ability.effects).toHaveLength(1);
  });

  it("supports an empty effects list", () => {
    const ability: CardAbility = {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.None },
      effects: [],
    };

    expect(ability.effects).toHaveLength(0);
  });
});
