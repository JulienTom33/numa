const IGNORED_PATTERNS: readonly RegExp[] = [
  /^src\/test\//,
  /^src\/docs\//,
  /^src\/i18n\/locales\//,
  /^src\/(main|App)\.tsx$/,
  /^src\/App\.test\.tsx$/,
  /^shared\/database\.types\.ts$/,
  /\.d\.ts$/,
];

const SOURCE_EXTENSION = /\.(ts|tsx)$/;
const SECONDARY_SUFFIX = /\.(test|stories)\.(ts|tsx)$/;

function directoryOf(file: string): string {
  return file.slice(0, file.lastIndexOf("/"));
}

function baseNameOf(file: string): string {
  return file.slice(file.lastIndexOf("/") + 1);
}

function stemOf(file: string): string {
  return baseNameOf(file).split(".")[0];
}

function isChecked(file: string): boolean {
  if (!/^(src|shared)\//.test(file)) return false;
  if (!SOURCE_EXTENSION.test(file)) return false;
  return !IGNORED_PATTERNS.some((pattern) => pattern.test(file));
}

export function findConventionViolations(files: readonly string[]): string[] {
  const known = new Set(files);
  const hasMain = (directory: string, stem: string): boolean =>
    known.has(`${directory}/${stem}.ts`) || known.has(`${directory}/${stem}.tsx`);
  const violations: string[] = [];

  for (const file of files.filter(isChecked)) {
    const directory = directoryOf(file);
    const folderName = baseNameOf(directory);
    const stem = stemOf(file);

    if (SECONDARY_SUFFIX.test(file)) {
      if (!hasMain(directory, stem)) {
        violations.push(`${file} : aucun fichier ${stem}.ts(x) correspondant dans le même dossier`);
      }
      continue;
    }

    if (stem !== folderName && !hasMain(directory, folderName)) {
      violations.push(
        `${file} : doit vivre dans un dossier dédié ${stem}/${baseNameOf(file)} ou dans le dossier d'un module ${folderName}/${folderName}.ts(x)`,
      );
    }
  }

  return violations.sort();
}
