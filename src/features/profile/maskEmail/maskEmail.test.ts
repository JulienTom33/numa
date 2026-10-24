import { describe, expect, it } from "vitest";
import { maskEmail } from "./maskEmail";

describe("maskEmail", () => {
  it("garde la première et la dernière lettre de la partie locale et le domaine", () => {
    expect(maskEmail("julien@example.com")).toBe("j****n@example.com");
  });

  it("masque entièrement sauf l'initiale quand la partie locale est très courte", () => {
    expect(maskEmail("ab@example.com")).toBe("a*@example.com");
    expect(maskEmail("a@example.com")).toBe("a*@example.com");
  });

  it("renvoie la valeur telle quelle sans arobase exploitable", () => {
    expect(maskEmail("invalide")).toBe("invalide");
    expect(maskEmail("@example.com")).toBe("@example.com");
  });
});
