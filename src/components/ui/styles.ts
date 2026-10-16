import { cx } from "../../lib/cx";

export const focusRing =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-ink";

export const focusWithinRing =
  "has-focus-visible:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-violet-ink";

export const fieldLabel = "font-display text-sm font-semibold text-ink";

const fieldBase =
  "h-12 w-full rounded-field border bg-white text-base text-ink focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-muted";
const fieldValid = "border-line focus:border-violet focus:ring-violet/30";
const fieldInvalid = "border-coral-ink focus:ring-coral/30";

export function fieldControl(hasError: boolean): string {
  return cx(fieldBase, hasError ? fieldInvalid : fieldValid);
}
