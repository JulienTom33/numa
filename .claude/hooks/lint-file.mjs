import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const input = JSON.parse(readFileSync(0, "utf8"));
const filePath = String(input.tool_input?.file_path ?? "").replaceAll("\\", "/");

if (!/\/(src|e2e)\/.*\.(ts|tsx)$/.test(filePath)) process.exit(0);

const result = spawnSync("npx", ["eslint", "--fix", filePath], { encoding: "utf8", shell: true });
if (result.status !== 0) {
  process.stderr.write(`${result.stdout}${result.stderr}`.trim().split("\n").slice(0, 30).join("\n") + "\n");
  process.exit(2);
}
