const STORAGE_KEY = "numa.discovery.conversionSheetDismissed";

export function isConversionSheetDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissConversionSheet(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return;
  }
}
