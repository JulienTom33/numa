// Limites RFC 5321 : au-delà, les serveurs SMTP refusent l'adresse.
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;
const MAX_DOMAIN_LABEL_LENGTH = 63;

const LOCAL_PART_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL_PATTERN = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TOP_LEVEL_DOMAIN_PATTERN = /^[A-Za-z]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim();
}

// Volontairement plus strict que la RFC 5322 (pas de guillemets, d'IP littérale ni de domaine
// sans point) : ces formes sont valides en théorie mais quasi toujours des fautes de frappe.
export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false;

  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || email.indexOf("@") !== atIndex) return false;

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (localPart.length > MAX_LOCAL_PART_LENGTH || !LOCAL_PART_PATTERN.test(localPart)) {
    return false;
  }

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  const topLevelDomain = labels[labels.length - 1];
  return (
    TOP_LEVEL_DOMAIN_PATTERN.test(topLevelDomain) &&
    labels.every(
      (label) => label.length <= MAX_DOMAIN_LABEL_LENGTH && DOMAIN_LABEL_PATTERN.test(label),
    )
  );
}
