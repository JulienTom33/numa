export type NotificationEventType =
  | "pr_opened"
  | "pr_updated"
  | "pr_changes_requested"
  | "pr_merged"
  | "ci_started"
  | "ci_success"
  | "ci_failure"
  | "ticket_status";

export interface NotificationEvent {
  type: NotificationEventType;
  repository: string;
  title: string;
  url: string;
  branch?: string;
  author?: string;
  summary?: string;
  status?: string;
}

interface DiscordEmbed {
  title: string;
  description: string;
  url: string;
  color: number;
  fields: { name: string; value: string; inline: boolean }[];
}

export interface DiscordPayload {
  content: string;
  embeds: DiscordEmbed[];
}

const COLOR_SUCCESS = 0x2ecc71;
const COLOR_FAILURE = 0xe74c3c;
const COLOR_ACTION_NEEDED = 0xf1c40f;
const COLOR_INFO = 0x5865f2;

const EVENT_LABELS: Record<NotificationEventType, string> = {
  pr_opened: "Pull request ouverte",
  pr_updated: "Pull request mise à jour",
  pr_changes_requested: "Correction demandée",
  pr_merged: "Pull request mergée",
  ci_started: "CI démarrée",
  ci_success: "CI réussie",
  ci_failure: "CI en échec",
  ticket_status: "Statut de ticket changé",
};

const EVENT_COLORS: Record<NotificationEventType, number> = {
  pr_opened: COLOR_INFO,
  pr_updated: COLOR_INFO,
  pr_changes_requested: COLOR_ACTION_NEEDED,
  pr_merged: COLOR_SUCCESS,
  ci_started: COLOR_INFO,
  ci_success: COLOR_SUCCESS,
  ci_failure: COLOR_FAILURE,
  ticket_status: COLOR_INFO,
};

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function buildDiscordMessage(event: NotificationEvent): DiscordPayload {
  const fields: DiscordEmbed["fields"] = [
    { name: "Dépôt", value: truncate(event.repository, 200), inline: true },
  ];

  if (event.branch) {
    fields.push({ name: "Branche", value: truncate(event.branch, 200), inline: true });
  }
  if (event.author) {
    fields.push({ name: "Auteur", value: truncate(event.author, 200), inline: true });
  }
  if (event.status) {
    fields.push({ name: "Statut", value: truncate(event.status, 200), inline: true });
  }

  return {
    content: EVENT_LABELS[event.type],
    embeds: [
      {
        title: truncate(event.title, 256),
        description: truncate(event.summary ?? "", 2000),
        url: event.url,
        color: EVENT_COLORS[event.type],
        fields,
      },
    ],
  };
}

export async function sendDiscordNotification(
  webhookUrl: string,
  payload: DiscordPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}
