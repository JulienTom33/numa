import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../../../i18n/i18n";
import { useOptionalText } from "./optionalText";

describe("useOptionalText", () => {
  afterEach(() => {
    i18n.removeResourceBundle("fr", "chartHouses");
    i18n.addResourceBundle("fr", "chartHouses", {});
  });

  it("renvoie null quand la clé n'existe pas", () => {
    const { result } = renderHook(() => useOptionalText());

    expect(result.current("chartSignsPersonal", "mercury.scorpio")).toBeNull();
    expect(result.current("chartHouses", "1")).toBeNull();
  });

  it("renvoie le texte quand la clé existe", () => {
    i18n.addResourceBundle("fr", "chartHouses", { "1": "Maison de l'identité." });
    const { result } = renderHook(() => useOptionalText());

    expect(result.current("chartHouses", "1")).toBe("Maison de l'identité.");
  });

  it("ignore un nœud qui n'est pas un texte", () => {
    i18n.addResourceBundle("fr", "chartHouses", { "2": { a: "b" } });
    const { result } = renderHook(() => useOptionalText());

    expect(result.current("chartHouses", "2")).toBeNull();
  });
});
