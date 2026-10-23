import { useTranslation } from "react-i18next";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Disclosure from "../../../shared/components/ui/Disclosure/Disclosure";
import Select from "../../../shared/components/ui/Select/Select";
import SelectableCardGroup, {
  type SelectableCardOption,
} from "../../../shared/components/ui/SelectableCardGroup/SelectableCardGroup";
import TextField from "../../../shared/components/ui/TextField/TextField";
import { TIME_MARGINS, type TimeMargin, type TimePrecision } from "../birthData/birthData";
import { type TimeStepValue, withPrecision } from "../timeStepValue/timeStepValue";

interface Props {
  value: TimeStepValue;
  onChange: (value: TimeStepValue) => void;
}

function isMargin(candidate: string): candidate is TimeMargin {
  return (TIME_MARGINS as readonly string[]).includes(candidate);
}

function TimeStep({ value, onChange }: Props) {
  const { t } = useTranslation("onboarding");

  const marginOptions = TIME_MARGINS.map((margin) => ({
    value: margin,
    label: t(`time.margins.${margin}`),
  }));

  const changeTime = (time: string) => {
    const next: TimeStepValue = { ...value };
    if (time) next.time = time;
    else delete next.time;
    onChange(next);
  };

  const changeMargin = (margin: string) => {
    if (isMargin(margin)) onChange({ ...value, margin });
  };

  const options: SelectableCardOption<TimePrecision>[] = [
    {
      value: "exact",
      title: t("time.exact.title"),
      description: t("time.exact.description"),
      content: (
        <TextField
          id="time-step__input--exact-time"
          label={t("time.exact.timeLabel")}
          type="time"
          value={value.time ?? ""}
          onChange={(event) => changeTime(event.target.value)}
        />
      ),
    },
    {
      value: "approximate",
      title: t("time.approximate.title"),
      description: t("time.approximate.description"),
      content: (
        <div className="flex flex-col gap-3">
          <TextField
            id="time-step__input--approximate-time"
            label={t("time.approximate.timeLabel")}
            type="time"
            value={value.time ?? ""}
            onChange={(event) => changeTime(event.target.value)}
          />
          <Select
            id="time-step__select--margin"
            label={t("time.approximate.marginLabel")}
            placeholder={t("time.approximate.marginPlaceholder")}
            options={marginOptions}
            value={value.margin ?? ""}
            onChange={(event) => changeMargin(event.target.value)}
          />
        </div>
      ),
    },
    {
      value: "unknown",
      title: t("time.unknown.title"),
      description: t("time.unknown.description"),
      content: (
        <div className="flex flex-col gap-3">
          <Callout id="time-step__callout--unknown-time" tone="warning">
            {t("time.unknown.warning")}
          </Callout>
          <Disclosure id="time-step__disclosure--where-to-find" summary={t("time.unknown.whereToFind.summary")}>
            <p>{t("time.unknown.whereToFind.body")}</p>
          </Disclosure>
        </div>
      ),
    },
  ];

  return (
    <div id="time-step__container--root" className="flex flex-col gap-4">
      <SelectableCardGroup
        id="time-step__cards--precision"
        label={t("time.question")}
        hideLabel
        options={options}
        value={value.precision}
        onChange={(precision) => onChange(withPrecision(value, precision))}
      />
    </div>
  );
}

export default TimeStep;
