import { assertEquals } from "jsr:@std/assert@1";
import { ENGINE_VERSION } from "../../../shared/contracts/natalChart/natalChart.ts";

Deno.test("la version du moteur declaree correspond a deno.json", async () => {
  const config = JSON.parse(await Deno.readTextFile(new URL("../deno.json", import.meta.url)));
  assertEquals(config.imports["astronomy-engine"], `npm:astronomy-engine@${ENGINE_VERSION}`);
});
