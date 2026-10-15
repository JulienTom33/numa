import type { QuestionProvider } from "./provider.ts";
import type { QuotaStore } from "./quota.ts";

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

export function echoProvider(): QuestionProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    answer: (question) => {
      calls.push(question);
      return Promise.resolve(`réponse à : ${question}`);
    },
  };
}
