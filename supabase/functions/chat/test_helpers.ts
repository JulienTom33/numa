import type { NatalChart } from "../../../shared/contracts/natalChart/natalChart.ts";
import { type HistoryMessage, PROMPT_VERSION } from "./prompt.ts";
import type { QuestionProvider } from "./provider.ts";
import type { QuotaStore } from "./quota.ts";
import type { ChartSource, ConversationStore } from "./store.ts";

type RecordInput = Parameters<ConversationStore["record"]>[0];

/** Reproduit en mémoire la sémantique des fonctions SQL reserve/commit/release_question. */
export function createMemoryStore(): QuotaStore & { pending: () => number } {
  const used = new Map<string, number>();
  const reservations = new Map<string, string>();
  let nextId = 0;

  const pendingFor = (userId: string) =>
    [...reservations.values()].filter((owner) => owner === userId).length;

  return {
    reserve: (userId, limit) => {
      if ((used.get(userId) ?? 0) + pendingFor(userId) >= limit) return Promise.resolve(null);
      const id = `reservation-${++nextId}`;
      reservations.set(id, userId);
      return Promise.resolve(id);
    },
    commit: (reservationId) => {
      const userId = reservations.get(reservationId);
      if (!userId) return Promise.reject(new Error("question reservation not found"));
      reservations.delete(reservationId);
      const count = (used.get(userId) ?? 0) + 1;
      used.set(userId, count);
      return Promise.resolve(count);
    },
    release: (reservationId) => {
      reservations.delete(reservationId);
      return Promise.resolve();
    },
    used: (userId) => Promise.resolve(used.get(userId) ?? 0),
    pending: () => reservations.size,
  };
}

export const failingProvider: QuestionProvider = {
  answer: () => Promise.reject(new Error("upstream down")),
};

export function echoProvider(): QuestionProvider & {
  calls: string[];
  histories: HistoryMessage[][];
} {
  const calls: string[] = [];
  const histories: HistoryMessage[][] = [];
  return {
    calls,
    histories,
    answer: ({ question, history }) => {
      calls.push(question);
      histories.push(history ?? []);
      return Promise.resolve({
        text: `réponse à : ${question}`,
        provider: "test",
        model: "test-model",
        promptVersion: PROMPT_VERSION,
      });
    },
  };
}

export function memoryCharts(chart: NatalChart | null = null): ChartSource {
  return { latest: () => Promise.resolve(chart) };
}

export function memoryConversations(
  ownsAll = true,
  past: Record<string, HistoryMessage[]> = {},
): ConversationStore & { recorded: RecordInput[] } {
  const recorded: RecordInput[] = [];
  return {
    recorded,
    owns: () => Promise.resolve(ownsAll),
    history: (userId, conversationId) => Promise.resolve(past[`${userId}:${conversationId}`] ?? []),
    record: (input) => {
      recorded.push(input);
      return Promise.resolve({
        conversationId: input.conversationId ?? "conversation-1",
        messageId: `message-${recorded.length}`,
      });
    },
  };
}

export function chartFixture(withAngles = true): NatalChart {
  return {
    schemaVersion: 1,
    engine: { name: "astronomy-engine", version: "2.1.19" },
    confidence: withAngles ? "high" : "low",
    birth: {
      birthDate: "1975-06-15",
      birthTime: "14:30:00",
      timePrecision: "exact",
      timeMargin: null,
      timezone: "Europe/Paris",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    instant: {
      utc: "1975-06-15T12:30:00Z",
      offsetMinutes: 120,
      offsetSeconds: null,
      status: "exact",
      localTimeUsed: "14:30",
    },
    bodies: [
      {
        body: "sun",
        longitude: 114.46,
        sign: "cancer",
        degreeInSign: 24.46,
        retrograde: false,
        speed: 0.96,
        house: 5,
      },
    ],
    angles: withAngles
      ? {
        ascendant: { longitude: 10.04, sign: "aries", degreeInSign: 10.04 },
        midheaven: { longitude: 280.14, sign: "capricorn", degreeInSign: 10.14 },
      }
      : null,
    houses: withAngles
      ? { requestedSystem: "placidus", system: "placidus", fallback: null, cusps: [] }
      : null,
    aspects: Array.from({ length: 15 }, (_, index) => ({
      bodyA: "sun" as const,
      bodyB: "moon" as const,
      type: "trine" as const,
      exactAngle: 120,
      orb: index + 0.04,
    })),
    moonSignChange: null,
    warnings: withAngles ? [] : ["unknown_time"],
  };
}
