import { describe, expect, it } from "vitest";
import { toHistoryAuthor } from "./historyData";

describe("toHistoryAuthor", () => {
  it("convertit les rôles utilisateur et assistant", () => {
    expect(toHistoryAuthor("user")).toBe("user");
    expect(toHistoryAuthor("assistant")).toBe("sidera");
  });

  it("ignore le rôle système et les rôles inconnus", () => {
    expect(toHistoryAuthor("system")).toBeNull();
    expect(toHistoryAuthor("autre")).toBeNull();
  });
});
