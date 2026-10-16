import { useTranslation } from "react-i18next";
import BottomSheet from "../../components/ui/BottomSheet/BottomSheet";
import Button from "../../components/ui/Button/Button";
import TextLink from "../../components/ui/TextLink/TextLink";

interface Props {
  open: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
  onContinue: () => void;
}

function ConversionSheet({ open, onSignUp, onSignIn, onContinue }: Props) {
  const { t } = useTranslation("discovery");

  return (
    <BottomSheet
      id="conversion-sheet__dialog--main"
      open={open}
      onClose={onContinue}
      title={t("sheet.title")}
      closeLabel={t("sheet.closeLabel")}
      aboveTabBar
      footer={
        <>
          <Button id="conversion-sheet__button--sign-up" fullWidth onClick={onSignUp}>
            {t("sheet.signUp")}
          </Button>
          <Button id="conversion-sheet__button--sign-in" variant="outline" fullWidth onClick={onSignIn}>
            {t("sheet.signIn")}
          </Button>
          <TextLink id="conversion-sheet__link--continue" onClick={onContinue} className="self-center">
            {t("sheet.continue")}
          </TextLink>
        </>
      }
    >
      <p id="conversion-sheet__text--body">{t("sheet.body")}</p>
    </BottomSheet>
  );
}

export default ConversionSheet;
