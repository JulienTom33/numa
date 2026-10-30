import { assertEquals } from "jsr:@std/assert@1";
import { logEvent, providerKind } from "./logger.ts";

function capture(method: "error" | "warn" | "log", run: () => void): string[] {
  const original = console[method];
  const lines: string[] = [];
  console[method] = (line: string) => lines.push(line);
  try {
    run();
  } finally {
    console[method] = original;
  }
  return lines;
}

Deno.test("logEvent writes one JSON line with level, event and timestamp", () => {
  const lines = capture(
    "error",
    () => logEvent("error", "boom", { request_id: "r1", status: 500 }),
  );

  const entry = JSON.parse(lines[0]);
  assertEquals(lines.length, 1);
  assertEquals(entry.level, "error");
  assertEquals(entry.event, "boom");
  assertEquals(entry.request_id, "r1");
  assertEquals(entry.status, 500);
  assertEquals(Number.isNaN(Date.parse(entry.ts)), false);
});

Deno.test("logEvent routes warn and info levels to the matching console method", () => {
  assertEquals(capture("warn", () => logEvent("warn", "w")).length, 1);
  assertEquals(capture("log", () => logEvent("info", "i")).length, 1);
});

Deno.test("logEvent does not let fields override level or event", () => {
  const lines = capture("error", () => logEvent("error", "real", { level: "info", event: "fake" }));

  const entry = JSON.parse(lines[0]);
  assertEquals(entry.level, "error");
  assertEquals(entry.event, "real");
});

Deno.test("providerKind tells geocoding apart from AI providers", () => {
  assertEquals(providerKind("open-meteo"), "geocoding");
  assertEquals(providerKind("gemini"), "ai");
  assertEquals(providerKind("astrology-api"), "astrology");
});
