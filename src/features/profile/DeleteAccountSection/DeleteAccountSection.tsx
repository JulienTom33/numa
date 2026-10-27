import { useState } from "react";
import { useTranslation } from "react-i18next";
import BottomSheet from "../../../shared/components/ui/BottomSheet/BottomSheet";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import TextField from "../../../shared/components/ui/TextField/TextField";
import type { AccountErrorCode } from "../accountService/accountService";

interface Props {
  deleting: boolean;
  errorCode: AccountErrorCode | null;
  onConfirm: () => void;
  onReset: () => void;
}

function DeleteAccountSection({ deleting, errorCode, onConfirm, onReset }: Props) {
  const { t } = useTranslation("profile");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const keyword = t("deleteAccount.keyword");
  const confirmed = typed.trim().toLowerCase() === keyword.toLowerCase();

  const close = () => {
    onReset();
    setTyped("");
    setOpen(false);
  };

  return (
    <section id="profile__section--delete-account" aria-labelledby="profile__title--delete-account" className="flex flex-col gap-2">
      <h2 id="profile__title--delete-account" className="font-display text-sm font-bold text-ink">
        {t("deleteAccount.title")}
      </h2>
      <p id="profile__text--delete-account" className="text-sm text-ink-secondary">
        {t("deleteAccount.description")}
      </p>
      <Button id="profile__button--delete-account" variant="outline" fullWidth onClick={() => setOpen(true)}>
        {t("deleteAccount.open")}
      </Button>
      <BottomSheet
        id="delete-account__sheet--main"
        open={open}
        onClose={close}
        title={t("deleteAccount.confirmTitle")}
        footer={
          <>
            <Button
              id="delete-account__button--confirm"
              variant="danger"
              fullWidth
              disabled={!confirmed}
              loading={deleting}
              loadingLabel={t("deleteAccount.deleting")}
              onClick={onConfirm}
            >
              {t("deleteAccount.confirm")}
            </Button>
            <Button id="delete-account__button--cancel" variant="outline" fullWidth disabled={deleting} onClick={close}>
              {t("deleteAccount.cancel")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p id="delete-account__text--scope">{t("deleteAccount.scope")}</p>
          <p id="delete-account__text--irreversible">{t("deleteAccount.irreversible")}</p>
          <TextField
            id="delete-account__input--keyword"
            label={t("deleteAccount.keywordLabel", { keyword })}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
          {errorCode !== null && (
            <Callout id="delete-account__callout--error" tone="error">
              {t(`deleteAccount.errors.${errorCode}`)}
            </Callout>
          )}
        </div>
      </BottomSheet>
    </section>
  );
}

export default DeleteAccountSection;
