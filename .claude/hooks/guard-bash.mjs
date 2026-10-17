import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";

const forbidden = [
  { pattern: /\bgh\s+pr\s+merge\b/, reason: "merge de PR interdit : action humaine uniquement" },
  { pattern: /\bgh\s+api\b.*\/merge\b/, reason: "merge de PR interdit : action humaine uniquement" },
  { pattern: /\bgit\s+push\b.*(--force\b|--force-with-lease\b|\s-f\b)/, reason: "force-push interdit" },
  { pattern: /\bgit\s+push\b.*\b(origin\s+)?(HEAD:)?master\b/, reason: "push direct sur master interdit : passer par une PR" },
  { pattern: /\bgit\s+reset\s+--hard\b/, reason: "git reset --hard interdit sans demande explicite" },
  { pattern: /\bnpm\s+audit\s+fix\s+--force\b/, reason: "npm audit fix --force interdit" },
];

const hit = forbidden.find(({ pattern }) => pattern.test(command));
if (hit) {
  process.stderr.write(`Commande bloquée : ${hit.reason}.\n`);
  process.exit(2);
}
