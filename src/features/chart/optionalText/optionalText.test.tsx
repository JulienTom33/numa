import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../../../i18n/i18n";
import { useOptionalText } from "./optionalText";

describe("useOptionalText", () => {
  afterEach(() => {
    const bundle = i18n.getResourceBundle("fr", "chartHouses") as Record<string, unknown>;
    delete bundle["test-texte"];
    delete bundle["test-noeud"];
  });

  it("renvoie null quand la clé n'existe pas", () => {
    const { result } = renderHook(() => useOptionalText());

    expect(result.current("chartSignsPersonal", "mercury.inexistant")).toBeNull();
    expect(result.current("chartHouses", "99")).toBeNull();
  });

  it("renvoie le texte quand la clé existe", () => {
    i18n.addResourceBundle("fr", "chartHouses", { "test-texte": "Maison de l'identité." }, true, true);
    const { result } = renderHook(() => useOptionalText());

    expect(result.current("chartHouses", "test-texte")).toBe("Maison de l'identité.");
  });

  it("ignore un nœud qui n'est pas un texte", () => {
    i18n.addResourceBundle("fr", "chartHouses", { "test-noeud": { a: "b" } }, true, true);
    const { result } = renderHook(() => useOptionalText());

    expect(result.current("chartHouses", "test-noeud")).toBeNull();
  });
});
