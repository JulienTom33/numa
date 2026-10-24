import { describe, expect, it } from "vitest";
import { queryKeys } from "./queryKeys";

describe("queryKeys", () => {
  it("préfixe chaque clé par son domaine pour permettre l'invalidation groupée", () => {
    expect(queryKeys.chart.mine().slice(0, 1)).toEqual(queryKeys.chart.all);
    expect(queryKeys.chart.ascendant("k").slice(0, 1)).toEqual(queryKeys.chart.all);
    expect(queryKeys.onboarding.status("u1").slice(0, 1)).toEqual(queryKeys.onboarding.all);
    expect(queryKeys.discovery.questionQuota().slice(0, 1)).toEqual(queryKeys.discovery.all);
  });

  it("distingue les utilisateurs et les clés de rafraîchissement", () => {
    expect(queryKeys.onboarding.draft("u1")).not.toEqual(queryKeys.onboarding.draft("u2"));
    expect(queryKeys.chart.ascendant("a")).not.toEqual(queryKeys.chart.ascendant("b"));
  });
});
