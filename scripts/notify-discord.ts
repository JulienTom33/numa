import {
  buildDiscordMessage,
  sendDiscordNotification,
  type NotificationEventType,
} from "../src/lib/discordNotify";

const EVENT_TYPES: NotificationEventType[] = [
  "pr_opened",
  "pr_updated",
  "pr_changes_requested",
  "pr_merged",
  "ci_started",
  "ci_success",
  "ci_failure",
  "ticket_status",
];

function requireEnv(name: string): string {
  return process.env[name] ?? "";
}

function isNotificationEventType(value: string): value is NotificationEventType {
  return (EVENT_TYPES as string[]).includes(value);
}

async function main(): Promise<void> {
  const type = process.argv[2] ?? "";
  const webhookUrl = requireEnv("DISCORD_WEBHOOK_URL");

  if (!isNotificationEventType(type)) {
    process.stderr.write(`notify-discord: type d'événement inconnu "${type}", ignoré.\n`);
    return;
  }

  const payload = buildDiscordMessage({
    type,
    repository: requireEnv("NOTIFY_REPOSITORY"),
    title: requireEnv("NOTIFY_TITLE"),
    url: requireEnv("NOTIFY_URL"),
    branch: process.env.NOTIFY_BRANCH,
    author: process.env.NOTIFY_AUTHOR,
    summary: process.env.NOTIFY_SUMMARY,
    status: process.env.NOTIFY_STATUS,
  });

  const ok = await sendDiscordNotification(webhookUrl, payload);
  if (!ok) {
    process.stderr.write("notify-discord: échec de l'envoi de la notification Discord.\n");
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`notify-discord: erreur inattendue: ${String(error)}\n`);
});
