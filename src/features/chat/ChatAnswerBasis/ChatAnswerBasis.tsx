import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../i18n/format/format";
import { HOUSE_SYSTEMS } from "../../../../shared/contracts/natalChart/natalChart";
import type { AnswerBasis, BasisBody, BasisPoint } from "../answerBasis/answerBasis";

const titleClass = "font-display text-sm font-semibold text-violet-ink";

const GLOSSARY_TERMS = ["retrograde", "house", "ascendant", "midheaven", "houseSystem", "transits"] as const;

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

  const houseSystem = HOUSE_SYSTEMS.find((system) => system === basis.houseSystem);

  const point = (key: "ascendant" | "midheaven", value: BasisPoint) =>
    t(`chat:basis.${key}`, {
      sign: t(`astrology:signs.${value.sign}`),
      degree: number(value.degreeInSign),
    });

  return (
    <div id={id} className="flex flex-col gap-3">
      <p id={`${id}-intro`}>{t("chat:basis.intro")}</p>

      <section id={`${id}-placements`} aria-labelledby={`${id}-placements-title`}>
        <p id={`${id}-placements-title`} className={titleClass}>
          {t("chat:basis.placementsTitle")}
        </p>
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
        {houseSystem === undefined ? (
          <p id={`${id}-houses-unavailable`}>{t("chat:basis.housesUnavailable")}</p>
        ) : (
          <p id={`${id}-house-system`}>
            {t("chat:basis.houseSystem", { system: t(`chat:basis.houseSystems.${houseSystem}`) })}
          </p>
        )}
      </section>

      <section id={`${id}-aspects`} aria-labelledby={`${id}-aspects-title`}>
        <p id={`${id}-aspects-title`} className={titleClass}>
          {t("chat:basis.aspectsTitle")}
        </p>
        {basis.aspects.length === 0 ? (
          <p id={`${id}-aspects-empty`}>{t("chat:basis.aspectsEmpty")}</p>
        ) : (
          <ul className="list-disc pl-5">
            {basis.aspects.map((aspect) => (
              <li key={`${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`} id={`${id}-aspect--${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}>
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

      <section id={`${id}-glossary`} aria-labelledby={`${id}-glossary-title`}>
        <p id={`${id}-glossary-title`} className={titleClass}>
          {t("chat:basis.glossaryTitle")}
        </p>
        <p id={`${id}-glossary-degree`}>{t("chat:basis.glossary")}</p>
        <ul className="list-disc pl-5">
          {GLOSSARY_TERMS.map((term) => (
            <li key={term} id={`${id}-glossary--${term}`}>
              <strong>{t(`chat:basis.glossaryTerms.${term}.label`)}</strong>
              {" : "}
              {t(`chat:basis.glossaryTerms.${term}.definition`)}
            </li>
          ))}
        </ul>
      </section>
      <p id={`${id}-confidence`}>
        {t("chat:basis.confidence", { level: t(`chat:basis.confidenceLevels.${basis.confidence}`) })}
      </p>

      {basis.warnings.length > 0 && (
        <section id={`${id}-warnings`} aria-labelledby={`${id}-warnings-title`}>
          <p id={`${id}-warnings-title`} className={titleClass}>
            {t("chat:basis.warningsTitle")}
          </p>
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
