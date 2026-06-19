import { describe, expect, it } from "vitest";

import { type CardDefinitionId, type CardInstanceId } from "../src";

describe("CardDefinitionId", () => {
  it("is a branded string", () => {
    const id = "card-def-1" as CardDefinitionId;

    expect(id).toBe("card-def-1");
  });
});

describe("CardInstanceId", () => {
  it("is a branded string", () => {
    const id = "card-instance-1" as CardInstanceId;

    expect(id).toBe("card-instance-1");
  });
});
