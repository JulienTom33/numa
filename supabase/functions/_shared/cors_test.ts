import { assertEquals } from "jsr:@std/assert@1";
import { corsHeaders, parseAllowedOrigins } from "./cors.ts";

Deno.test("parseAllowedOrigins splits, trims and drops empty entries", () => {
  assertEquals(parseAllowedOrigins(" https://a.test , ,https://b.test"), [
    "https://a.test",
    "https://b.test",
  ]);
  assertEquals(parseAllowedOrigins(undefined), []);
});

Deno.test("corsHeaders allows a listed origin", () => {
  const req = new Request("https://fn.test", { headers: { Origin: "https://numa.test" } });
  const headers = corsHeaders(req, ["https://numa.test"], ["POST"]);

  assertEquals(headers.get("Access-Control-Allow-Origin"), "https://numa.test");
  assertEquals(headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  assertEquals(headers.get("Vary"), "Origin");
});

Deno.test("corsHeaders does not allow an unlisted origin", () => {
  const req = new Request("https://fn.test", { headers: { Origin: "https://evil.test" } });
  const headers = corsHeaders(req, ["https://numa.test"], ["POST"]);

  assertEquals(headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("corsHeaders works without Origin header", () => {
  const headers = corsHeaders(new Request("https://fn.test"), ["https://numa.test"], ["GET"]);

  assertEquals(headers.get("Access-Control-Allow-Origin"), null);
  assertEquals(
    headers.get("Access-Control-Allow-Headers"),
    "authorization, x-client-info, apikey, content-type",
  );
});
