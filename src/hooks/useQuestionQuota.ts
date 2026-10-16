import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateQuestionQuotaError, type TranslatedQuestionQuotaError } from "../i18n/messages/questionQuota";
import {
  askQuestion,
  fetchQuestionQuota,
  type AskQuestionResult,
  type QuestionQuota,
  type QuestionQuotaError,
} from "../lib/questionQuota";

export interface UseQuestionQuotaResult {
  quota: QuestionQuota | null;
  loading: boolean;
  error: TranslatedQuestionQuotaError | null;
  refresh: () => Promise<void>;
  ask: (question: string) => Promise<AskQuestionResult>;
}

/** Expose le quota de questions anonymes sans jamais le calculer côté client. */
export function useQuestionQuota(): UseQuestionQuotaResult {
  const { t } = useTranslation("common");
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
      const latest = await fetchQuestionQuota();
      setQuota(latest.quota);
    }
    setLoading(false);
    return result;
  }, []);

  const translatedError = useMemo(() => error && translateQuestionQuotaError(error, t), [error, t]);

  return { quota, loading, error: translatedError, refresh, ask };
}
