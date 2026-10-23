import { readdirSync } from "node:fs";
import { join } from "node:path";
import { findConventionViolations } from "./checkModuleConvention/checkModuleConvention";

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name).split("\\").join("/");
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const violations = findConventionViolations([...listFiles("src"), ...listFiles("shared")]);

if (violations.length > 0) {
  process.stderr.write(
    `Convention <Nom>/<Nom>.tsx non respectée :\n${violations.map((line) => `  - ${line}`).join("\n")}\n`,
  );
  process.exit(1);
}

process.stdout.write("Convention un dossier par module respectée.\n");
