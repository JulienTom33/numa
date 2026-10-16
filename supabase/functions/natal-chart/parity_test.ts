import { assert, assertEquals } from "jsr:@std/assert@1";
import { ENGINE_VERSION } from "./types.ts";

const SOURCE_ROOT = new URL("../../../src/lib/", import.meta.url);
const COPY_ROOT = new URL("../_shared/time/", import.meta.url);

// Le code deploye ne peut pas importer src/ (hors du dossier bundle par Supabase) : _shared/time
// en est une copie sans commentaires. Ce test echoue des qu'elles divergent.
function normalize(source: string): string {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/\/\*\*[\s\S]*?\*\/\n/g, "")
    .replace(/from "\.\/legalMeanTime(\.ts)?"/, 'from "./legalMeanTime"')
    .replace(/\s+/g, " ")
    .trim();
}

for (const file of ["utcOffset.ts", "legalMeanTime.ts"]) {
  Deno.test(`parite : _shared/time/${file} identique a src/lib/${file} (hors commentaires)`, async () => {
    const original = await Deno.readTextFile(new URL(file, SOURCE_ROOT));
    const copy = await Deno.readTextFile(new URL(file, COPY_ROOT));
    assertEquals(normalize(copy), normalize(original));
    assert(
      !/\/\*|\/\//.test(copy.replace(/https?:\/\//g, "")),
      "la copie ne contient aucun commentaire",
    );
  });
}

Deno.test("la version du moteur declaree correspond a deno.json", async () => {
  const config = JSON.parse(await Deno.readTextFile(new URL("../deno.json", import.meta.url)));
  assertEquals(config.imports["astronomy-engine"], `npm:astronomy-engine@${ENGINE_VERSION}`);
});
