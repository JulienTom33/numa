import { describe, expect, it, vi } from "vitest";
import {
  buildDiscordMessage,
  isNotificationEventType,
  NOTIFICATION_EVENT_TYPES,
  sendDiscordNotification,
} from "./discordNotify";

describe("buildDiscordMessage", () => {
  it("formats a PR opened event with fields and color", () => {
    const payload = buildDiscordMessage({
      type: "pr_opened",
      repository: "julto/numa",
      title: "feat: add feature",
      url: "https://github.com/julto/numa/pull/1",
      branch: "epic/foo/issue-1",
      author: "julto",
      summary: "Ajoute une fonctionnalité",
    });

    expect(payload.content).toBe("Pull request ouverte");
    expect(payload.embeds[0].title).toBe("feat: add feature");
    expect(payload.embeds[0].url).toBe("https://github.com/julto/numa/pull/1");
    expect(payload.embeds[0].fields).toEqual([
      { name: "Dépôt", value: "julto/numa", inline: true },
      { name: "Branche", value: "epic/foo/issue-1", inline: true },
      { name: "Auteur", value: "julto", inline: true },
    ]);
  });

  it("uses failure color for ci_failure", () => {
    const payload = buildDiscordMessage({
      type: "ci_failure",
      repository: "julto/numa",
      title: "CI #42",
      url: "https://github.com/julto/numa/actions/runs/42",
      status: "failure",
    });

    expect(payload.embeds[0].color).toBe(0xe74c3c);
    expect(payload.content).toBe("CI en échec");
  });

  it("truncates overly long title and summary", () => {
    const payload = buildDiscordMessage({
      type: "ticket_status",
      repository: "julto/numa",
      title: "x".repeat(300),
      url: "https://github.com/julto/numa/issues/1",
      summary: "y".repeat(2100),
    });

    expect(payload.embeds[0].title.length).toBe(256);
    expect(payload.embeds[0].title.endsWith("…")).toBe(true);
    expect(payload.embeds[0].description.length).toBe(2000);
  });
});

describe("Claude review notifications", () => {
  const base = {
    repository: "julto/numa",
    title: "feat: add feature",
    url: "https://github.com/julto/numa/pull/1",
    branch: "issue-1-feature",
  };

  it("announces a PR ready for human review with success color", () => {
    const payload = buildDiscordMessage({ ...base, type: "claude_review_ok", summary: "RAS" });

    expect(payload.content).toBe("Review Claude OK : PR prête pour review humaine");
    expect(payload.embeds[0].color).toBe(0x2ecc71);
    expect(payload.embeds[0].description).toBe("RAS");
  });

  it("announces an automatic fix in progress with its iteration status", () => {
    const payload = buildDiscordMessage({ ...base, type: "claude_review_fixing", status: "1/3" });

    expect(payload.content).toBe("Review Claude : correction automatique en cours");
    expect(payload.embeds[0].color).toBe(0x5865f2);
    expect(payload.embeds[0].fields).toContainEqual({ name: "Statut", value: "1/3", inline: true });
  });

  it("asks for human intervention with action-needed color", () => {
    const payload = buildDiscordMessage({
      ...base,
      type: "claude_review_human_needed",
      status: "3/3",
    });

    expect(payload.content).toBe("Review Claude : intervention humaine requise");
    expect(payload.embeds[0].color).toBe(0xf1c40f);
  });
});

describe("isNotificationEventType", () => {
  it("accepts every declared event type", () => {
    for (const type of NOTIFICATION_EVENT_TYPES) {
      expect(isNotificationEventType(type)).toBe(true);
    }
  });

  it("rejects unknown event types", () => {
    expect(isNotificationEventType("claude_review_approved")).toBe(false);
    expect(isNotificationEventType("")).toBe(false);
  });
});

describe("sendDiscordNotification", () => {
  it("returns true when the webhook responds ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

    const result = await sendDiscordNotification(
      "https://discord.com/api/webhooks/1/abc",
      { content: "hello", embeds: [] },
      fetchImpl,
    );

    expect(result).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/1/abc",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns false without throwing when fetch rejects", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await sendDiscordNotification(
      "https://discord.com/api/webhooks/1/abc",
      { content: "hello", embeds: [] },
      fetchImpl,
    );

    expect(result).toBe(false);
  });

  it("returns false when the webhook responds with an error status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false });

    const result = await sendDiscordNotification(
      "https://discord.com/api/webhooks/1/abc",
      { content: "hello", embeds: [] },
      fetchImpl,
    );

    expect(result).toBe(false);
  });

  it("returns false when the webhook url is empty", async () => {
    const fetchImpl = vi.fn();

    const result = await sendDiscordNotification("", { content: "hello", embeds: [] }, fetchImpl);

    expect(result).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
