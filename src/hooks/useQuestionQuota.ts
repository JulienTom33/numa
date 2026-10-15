import { useCallback, useEffect, useState } from "react";
import {
  askQuestion,
  fetchQuestionQuota,
  type AskQuestionResult,
  type QuestionQuota,
  type QuestionQuotaError,
} from "../lib/questionQuota";

export interface UseQuestionQuotaResult {
  /** Compteur lu depuis le serveur ; null tant qu'il n'est pas chargé ou pour un compte identifié. */
  quota: QuestionQuota | null;
  loading: boolean;
  error: QuestionQuotaError | null;
  refresh: () => Promise<void>;
  ask: (question: string) => Promise<AskQuestionResult>;
}

/** Expose le quota de questions anonymes sans jamais le calculer côté client. */
export function useQuestionQuota(): UseQuestionQuotaResult {
  const [quota, setQuota] = useState<QuestionQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<QuestionQuotaError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchQuestionQuota();
    setQuota(result.quota);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ask = useCallback(async (question: string) => {
    setLoading(true);
    const result = await askQuestion(question);
    setError(result.error);
    if (result.quota) {
      setQuota(result.quota);
    } else if (result.error?.code === "question_quota_exceeded") {
      // Le serveur a refusé : le compteur local est périmé (autre onglet, autre appareil).
      const latest = await fetchQuestionQuota();
      setQuota(latest.quota);
    }
    setLoading(false);
    return result;
  }, []);

  return { quota, loading, error, refresh, ask };
}
