import { assertEquals } from "jsr:@std/assert@1";
import { containsPersonalData } from "./questionGuard.ts";

Deno.test("detects e-mails, phone numbers and dates", () => {
  for (
    const question of [
      "mon mail : a.b@exemple.fr",
      "mon numéro 06 12 34 56 78",
      "+33 6 12 34 56 78",
      "née le 15/06/1975",
      "née le 1975-06-15",
    ]
  ) {
    assertEquals(containsPersonalData(question), true, question);
  }
});

Deno.test("lets astrological questions through", () => {
  for (
    const question of [
      "Que dit mon Soleil en maison 5 ?",
      "Vais-je changer de travail cette année ?",
      "Mon Mercure à 12 degrés est-il rétrograde ?",
    ]
  ) {
    assertEquals(containsPersonalData(question), false, question);
  }
});
