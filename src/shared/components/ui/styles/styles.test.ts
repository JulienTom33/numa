import { describe, expect, it } from "vitest";
import { fieldControl } from "./styles";

describe("fieldControl", () => {
  it("uses the neutral border when valid", () => {
    const classes = fieldControl(false);

    expect(classes).toContain("border-line");
    expect(classes).not.toContain("border-coral-ink");
  });

  it("uses the error border when invalid", () => {
    const classes = fieldControl(true);

    expect(classes).toContain("border-coral-ink");
    expect(classes).not.toContain("border-line");
  });
});
