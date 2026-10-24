import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateQuestionQuotaError, type TranslatedQuestionQuotaError } from "../../../i18n/messages/questionQuota/questionQuota";
import { CodedQueryError, errorCodeOf } from "../../../shared/queryClient/CodedQueryError/CodedQueryError";
import { queryKeys } from "../../../shared/queryClient/queryKeys/queryKeys";
import {
  askQuestion,
  fetchQuestionQuota,
  type AskQuestionResult,
  type QuestionQuota,
  type QuestionQuotaError,
  type QuestionQuotaErrorCode,
} from "../questionQuota/questionQuota";

export interface UseQuestionQuotaResult {
  quota: QuestionQuota | null;
  loading: boolean;
  error: TranslatedQuestionQuotaError | null;
  refresh: () => Promise<void>;
  ask: (question: string) => Promise<AskQuestionResult>;
}

const QUOTA_ERROR_CODES: readonly QuestionQuotaErrorCode[] = [
  "question_quota_exceeded",
  "provider_unavailable",
  "invalid_question",
  "unauthenticated",
  "network_error",
  "unknown_error",
];

async function loadQuota(): Promise<QuestionQuota | null> {
  const result = await fetchQuestionQuota();
  if (result.error) throw new CodedQueryError(result.error.code);
  return result.quota;
}

export function useQuestionQuota(): UseQuestionQuotaResult {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<QuestionQuotaError | null>(null);
  const query = useQuery({ queryKey: queryKeys.discovery.questionQuota(), queryFn: loadQuota });

  const refresh = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: queryKeys.discovery.questionQuota() });
  }, [queryClient]);

  const ask = useCallback(
    async (question: string) => {
      setAsking(true);
      const result = await askQuestion(question);
      setAskError(result.error);
      if (result.quota) {
        queryClient.setQueryData(queryKeys.discovery.questionQuota(), result.quota);
      } else if (result.error?.code === "question_quota_exceeded") {
        await refresh();
      }
      setAsking(false);
      return result;
    },
    [queryClient, refresh],
  );

  const loadError = useMemo<QuestionQuotaError | null>(
    () => (query.isError ? { code: errorCodeOf(query.error, QUOTA_ERROR_CODES, "unknown_error") } : null),
    [query.isError, query.error],
  );
  const error = askError ?? loadError;
  const translatedError = useMemo(() => error && translateQuestionQuotaError(error, t), [error, t]);

  return { quota: query.data ?? null, loading: query.isFetching || asking, error: translatedError, refresh, ask };
}
