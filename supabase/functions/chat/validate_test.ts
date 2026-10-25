import { assertEquals } from "jsr:@std/assert@1";
import { finalizeAnswer, MAX_ANSWER_CHARS } from "./validate.ts";

const FRENCH = "Votre Soleil est dans le signe du Cancer. Cela invite à la douceur";

Deno.test("accepts and trims a French answer", () => {
  assertEquals(finalizeAnswer({ text: `  ${FRENCH}.  `, truncated: false }), `${FRENCH}.`);
});

Deno.test("rejects empty and non-French answers", () => {
  assertEquals(finalizeAnswer({ text: "  ", truncated: false }), null);
  assertEquals(
    finalizeAnswer({ text: "Your sun sign suggests a calm nature.", truncated: false }),
    null,
  );
});

Deno.test("cuts a truncated answer at the last complete sentence", () => {
  assertEquals(
    finalizeAnswer({ text: `${FRENCH}. Et la Lune est dans le`, truncated: true }),
    `${FRENCH}.`,
  );
});

Deno.test("caps an overlong answer at a sentence boundary", () => {
  const long = `${FRENCH}. ` + "Une phrase de plus pour vous. ".repeat(200);
  const result = finalizeAnswer({ text: long, truncated: false });

  assertEquals(result !== null && result.length <= MAX_ANSWER_CHARS, true);
  assertEquals(result?.endsWith("."), true);
});
