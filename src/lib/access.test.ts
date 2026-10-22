import { describe, expect, it } from "vitest";
import { accountScope, transactionScope } from "./access";

describe("access scopes", () => {
  it("admins see the whole household", () => {
    expect(transactionScope({ id: "u1", householdId: "h1", role: "ADMIN" })).toEqual({ householdId: "h1" });
  });
  it("members see only their own rows", () => {
    expect(transactionScope({ id: "u2", householdId: "h1", role: "MEMBER" })).toEqual({ householdId: "h1", userId: "u2" });
    expect(accountScope({ id: "u2", householdId: "h1", role: "MEMBER" })).toEqual({ householdId: "h1", ownerId: "u2" });
  });
});
