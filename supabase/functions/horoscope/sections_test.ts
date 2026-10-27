import { assertEquals } from "jsr:@std/assert@1";
import { joinSections, parseSections, readSections } from "./sections.ts";

const VALID = [
  "[general]",
  "Une journée qui invite à la douceur.",
  "[relations]",
  "Le dialogue peut être favorisé",
  "et plus fluide.",
  "[work]",
  "Vous pouvez avancer pas à pas.",
  "[energy]",
  "Votre énergie tend à se stabiliser.",
].join("\n");

Deno.test("parseSections reads the four sections and joins wrapped lines", () => {
  assertEquals(parseSections(VALID), {
    general: "Une journée qui invite à la douceur.",
    relations: "Le dialogue peut être favorisé et plus fluide.",
    work: "Vous pouvez avancer pas à pas.",
    energy: "Votre énergie tend à se stabiliser.",
  });
});

Deno.test("parseSections rejects a missing or empty section", () => {
  assertEquals(
    parseSections(VALID.replace("[energy]\nVotre énergie tend à se stabiliser.", "")),
    null,
  );
  assertEquals(parseSections(VALID.replace("Vous pouvez avancer pas à pas.", "")), null);
  assertEquals(parseSections("pas de sections"), null);
});

Deno.test("parseSections rejects categorical wording", () => {
  assertEquals(
    parseSections(VALID.replace("peut être favorisé", "va toujours être favorisé")),
    null,
  );
  assertEquals(parseSections(VALID.replace("tend à", "va certainement")), null);
  assertEquals(parseSections(VALID.replace("tend à", "va forcément")), null);
  assertEquals(parseSections(VALID.replace("tend à", "sera inévitablement")), null);
  assertEquals(parseSections(VALID.replace("tend à", "sans aucun doute")), null);
  assertEquals(parseSections(VALID.replace("Vous pouvez", "Vous êtes prêt à")), null);
  assertEquals(
    parseSections(VALID.replace("Vous pouvez", "Vous êtes peut-être prêt à"))?.work,
    "Vous êtes peut-être prêt à avancer pas à pas.",
  );
});

Deno.test("readSections validates a stored payload", () => {
  const sections = { general: "a", relations: "b", work: "c", energy: "d" };

  assertEquals(readSections(sections), sections);
  assertEquals(readSections({ ...sections, work: 3 }), null);
  assertEquals(readSections(null), null);
});

Deno.test("joinSections keeps the display order", () => {
  assertEquals(
    joinSections({ general: "a", relations: "b", work: "c", energy: "d" }),
    "a\n\nb\n\nc\n\nd",
  );
});
