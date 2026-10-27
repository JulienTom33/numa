import { useTranslation } from "react-i18next";
import BottomSheet from "../../../shared/components/ui/BottomSheet/BottomSheet";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import type { HistoryErrorCode } from "../historyData/historyData";

interface Props {
  open: boolean;
  title: string;
  deleting: boolean;
  errorCode: HistoryErrorCode | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConversationSheet({ open, title, deleting, errorCode, onConfirm, onCancel }: Props) {
  const { t } = useTranslation("history");

  return (
    <BottomSheet
      id="delete-conversation__sheet--main"
      open={open}
      onClose={onCancel}
      title={t("delete.title")}
      footer={
        <>
          <Button
            id="delete-conversation__button--confirm"
            variant="danger"
            fullWidth
            loading={deleting}
            loadingLabel={t("delete.deleting")}
            onClick={onConfirm}
          >
            {t("delete.confirm")}
          </Button>
          <Button id="delete-conversation__button--cancel" variant="outline" fullWidth disabled={deleting} onClick={onCancel}>
            {t("delete.cancel")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p id="delete-conversation__text--message">{t("delete.message", { title })}</p>
        {errorCode !== null && (
          <Callout id="delete-conversation__callout--error" tone="error">
            {t(`errors.${errorCode}`)}
          </Callout>
        )}
      </div>
    </BottomSheet>
  );
}

export default DeleteConversationSheet;
