import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../i18n/format/format";
import type { AnswerBasis, BasisBody, BasisPoint } from "../answerBasis/answerBasis";

interface Props {
  messageId: string;
  basis: AnswerBasis | null;
}

function bodyKey(body: BasisBody): "placement" | "placementHouse" | "placementRetrograde" | "placementHouseRetrograde" {
  if (body.house !== null && body.retrograde) return "placementHouseRetrograde";
  if (body.house !== null) return "placementHouse";
  if (body.retrograde) return "placementRetrograde";
  return "placement";
}

function ChatAnswerBasis({ messageId, basis }: Props) {
  const { t, i18n } = useTranslation(["chat", "astrology"]);
  const id = `chat-answer-basis__section--${messageId}`;
  const number = (value: number) => formatNumber(value, i18n.language, { maximumFractionDigits: 1 });

  if (basis === null) {
    return (
      <p id={`${id}-no-chart`} className="text-sm">
        {t("chat:basis.noChart")}
      </p>
    );
  }

  const point = (key: "ascendant" | "midheaven", value: BasisPoint) =>
    t(`chat:basis.${key}`, {
      sign: t(`astrology:signs.${value.sign}`),
      degree: number(value.degreeInSign),
    });

  return (
    <div id={id} className="flex flex-col gap-3">
      <p id={`${id}-intro`}>{t("chat:basis.intro")}</p>

      <section id={`${id}-placements`} aria-labelledby={`${id}-placements-title`}>
        <h4 id={`${id}-placements-title`} className="font-semibold">
          {t("chat:basis.placementsTitle")}
        </h4>
        <ul className="list-disc pl-5">
          {basis.bodies.map((body) => (
            <li key={body.body} id={`${id}-body--${body.body}`}>
              {t(`chat:basis.${bodyKey(body)}`, {
                body: t(`astrology:bodies.${body.body}`),
                sign: t(`astrology:signs.${body.sign}`),
                degree: number(body.degreeInSign),
                house: body.house,
              })}
            </li>
          ))}
          {basis.ascendant && (
            <li id={`${id}-ascendant`}>{point("ascendant", basis.ascendant)}</li>
          )}
          {basis.midheaven && (
            <li id={`${id}-midheaven`}>{point("midheaven", basis.midheaven)}</li>
          )}
        </ul>
        {basis.ascendant === null && (
          <p id={`${id}-angles-unavailable`}>{t("chat:basis.anglesUnavailable")}</p>
        )}
        {basis.houseSystem === null && (
          <p id={`${id}-houses-unavailable`}>{t("chat:basis.housesUnavailable")}</p>
        )}
      </section>

      <section id={`${id}-aspects`} aria-labelledby={`${id}-aspects-title`}>
        <h4 id={`${id}-aspects-title`} className="font-semibold">
          {t("chat:basis.aspectsTitle")}
        </h4>
        {basis.aspects.length === 0 ? (
          <p id={`${id}-aspects-empty`}>{t("chat:basis.aspectsEmpty")}</p>
        ) : (
          <ul className="list-disc pl-5">
            {basis.aspects.map((aspect) => (
              <li key={`${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`} id={`${id}-aspect--${aspect.bodyA}-${aspect.bodyB}`}>
                {t("chat:basis.aspect", {
                  bodyA: t(`astrology:bodies.${aspect.bodyA}`),
                  bodyB: t(`astrology:bodies.${aspect.bodyB}`),
                  type: t(`chat:basis.aspectTypes.${aspect.type}`),
                  orb: number(aspect.orb),
                  meaning: t(`chat:basis.aspectMeanings.${aspect.type}`),
                })}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p id={`${id}-glossary`}>{t("chat:basis.glossary")}</p>
      <p id={`${id}-confidence`}>
        {t("chat:basis.confidence", { level: t(`chat:basis.confidenceLevels.${basis.confidence}`) })}
      </p>

      {basis.warnings.length > 0 && (
        <section id={`${id}-warnings`} aria-labelledby={`${id}-warnings-title`}>
          <h4 id={`${id}-warnings-title`} className="font-semibold">
            {t("chat:basis.warningsTitle")}
          </h4>
          <ul className="list-disc pl-5">
            {basis.warnings.map((warning) => (
              <li key={warning} id={`${id}-warning--${warning}`}>
                {t(`chat:basis.warnings.${warning}`)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default ChatAnswerBasis;
