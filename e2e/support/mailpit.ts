import { expect } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitMessage {
  ID: string;
}

interface MailpitList {
  messages: MailpitMessage[];
}

export interface MailpitDetail {
  HTML: string;
  Text: string;
  Subject: string;
}

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}@example.test`;
}

async function findMessageId(address: string): Promise<string | null> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
  if (!response.ok) throw new Error(`Mailpit indisponible (${response.status})`);
  const list = (await response.json()) as MailpitList;
  return list.messages[0]?.ID ?? null;
}

export async function waitForEmail(address: string): Promise<MailpitDetail> {
  let messageId: string | null = null;
  await expect
    .poll(
      async () => {
        messageId = await findMessageId(address);
        return messageId;
      },
      { timeout: 20_000, message: `Aucun email reçu pour ${address}` },
    )
    .not.toBeNull();
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  return (await response.json()) as MailpitDetail;
}

export async function resolveMagicLinkHash(message: MailpitDetail): Promise<string> {
  const match = /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]*/.exec(message.Text + message.HTML);
  if (!match) throw new Error("Lien magique introuvable dans l'email");
  const response = await fetch(match[0].replace(/&amp;/g, "&"), { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  const hashIndex = location.indexOf("#");
  if (hashIndex < 0) throw new Error(`Redirection du lien magique sans jeton (statut ${response.status})`);
  return location.slice(hashIndex);
}
