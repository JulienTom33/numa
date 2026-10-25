import { useTranslation } from "react-i18next";
import BottomSheet from "../../../shared/components/ui/BottomSheet/BottomSheet";
import Button from "../../../shared/components/ui/Button/Button";
import TextLink from "../../../shared/components/ui/TextLink/TextLink";

interface Props {
  open: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
  onContinue: () => void;
}

const BENEFIT_KEYS = ["history", "chart", "devices"] as const;

function SignupPrompt({ open, onSignUp, onSignIn, onContinue }: Props) {
  const { t } = useTranslation("chat");

  return (
    <BottomSheet
      id="signup-prompt__dialog--main"
      open={open}
      onClose={onContinue}
      title={t("signupPrompt.title")}
      closeLabel={t("signupPrompt.closeLabel")}
      aboveTabBar
      footer={
        <>
          <Button id="signup-prompt__button--sign-up" fullWidth onClick={onSignUp}>
            {t("signupPrompt.signUp")}
          </Button>
          <Button id="signup-prompt__button--sign-in" variant="outline" fullWidth onClick={onSignIn}>
            {t("signupPrompt.signIn")}
          </Button>
          <TextLink id="signup-prompt__link--continue" onClick={onContinue} className="self-center">
            {t("signupPrompt.continue")}
          </TextLink>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p id="signup-prompt__text--intro">{t("signupPrompt.intro")}</p>
        <ul id="signup-prompt__list--benefits" className="list-disc pl-5">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} id={`signup-prompt__item--${key}`}>
              {t(`signupPrompt.benefits.${key}`)}
            </li>
          ))}
        </ul>
        <p id="signup-prompt__text--reassurance">{t("signupPrompt.reassurance")}</p>
      </div>
    </BottomSheet>
  );
}

export default SignupPrompt;
