import { readFileSync } from "node:fs";
import { basename } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const filePath = String(input.tool_input?.file_path ?? "").replaceAll("\\", "/");
const name = basename(filePath);

const isEnvFile = name === ".env" || (name.startsWith(".env.") && name !== ".env.example");
const isPrivateKey = /\.(pem|key|p12|pfx)$/i.test(name);
const isWorkflow = filePath.includes("/.github/workflows/");

if (isEnvFile || isPrivateKey) {
  process.stderr.write("Édition bloquée : fichier de secrets. Les secrets ne sont jamais commités.\n");
  process.exit(2);
}
if (isWorkflow && process.env.CLAUDE_ALLOW_WORKFLOW_EDIT !== "1") {
  process.stderr.write("Édition de .github/workflows bloquée par défaut : relancer avec CLAUDE_ALLOW_WORKFLOW_EDIT=1 sur demande explicite.\n");
  process.exit(2);
}
