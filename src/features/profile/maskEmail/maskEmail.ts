export function maskEmail(email: string): string {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 2) return `${local.charAt(0)}*${domain}`;
  return `${local.charAt(0)}${"*".repeat(local.length - 2)}${local.charAt(local.length - 1)}${domain}`;
}
