import Callout from "../../../components/ui/Callout/Callout";
import Disclosure from "../../../components/ui/Disclosure/Disclosure";
import Select from "../../../components/ui/Select/Select";
import SelectableCardGroup, {
  type SelectableCardOption,
} from "../../../components/ui/SelectableCardGroup/SelectableCardGroup";
import TextField from "../../../components/ui/TextField/TextField";
import {
  type BirthTimeMargin,
  type BirthTimePrecision,
  type TimeStepValue,
  birthTimeMarginLabels,
  withPrecision,
} from "./timeStepValue";

interface Props {
  value: TimeStepValue;
  onChange: (value: TimeStepValue) => void;
}

const marginOptions = (Object.keys(birthTimeMarginLabels) as BirthTimeMargin[]).map((margin) => ({
  value: margin,
  label: birthTimeMarginLabels[margin],
}));

function isMargin(candidate: string): candidate is BirthTimeMargin {
  return candidate in birthTimeMarginLabels;
}

function TimeStep({ value, onChange }: Props) {
  const changeTime = (time: string) => {
    const next: TimeStepValue = { ...value };
    if (time) next.time = time;
    else delete next.time;
    onChange(next);
  };

  const changeMargin = (margin: string) => {
    if (isMargin(margin)) onChange({ ...value, margin });
  };

  const options: SelectableCardOption<BirthTimePrecision>[] = [
    {
      value: "exact",
      title: "Heure exacte",
      description: "Je connais l'heure à la minute près.",
      content: (
        <TextField
          id="time-step__input--exact-time"
          label="Heure de naissance"
          type="time"
          value={value.time ?? ""}
          onChange={(event) => changeTime(event.target.value)}
        />
      ),
    },
    {
      value: "approximate",
      title: "Heure approximative",
      description: "Je connais l'heure à peu près.",
      content: (
        <div className="flex flex-col gap-3">
          <TextField
            id="time-step__input--approximate-time"
            label="Heure approximative"
            type="time"
            value={value.time ?? ""}
            onChange={(event) => changeTime(event.target.value)}
          />
          <Select
            id="time-step__select--margin"
            label="Marge d'incertitude"
            placeholder="Choisir une marge"
            options={marginOptions}
            value={value.margin ?? ""}
            onChange={(event) => changeMargin(event.target.value)}
          />
        </div>
      ),
    },
    {
      value: "unknown",
      title: "Heure inconnue",
      description: "Je ne connais pas mon heure de naissance.",
      content: (
        <div className="flex flex-col gap-3">
          <Callout id="time-step__callout--unknown-time" tone="warning">
            Sans heure de naissance, votre ascendant et vos maisons astrologiques seront imprécis.
          </Callout>
          <Disclosure id="time-step__disclosure--where-to-find" summary="Où trouver cette information ?">
            <p>
              L'heure figure souvent sur la copie intégrale de votre acte de naissance, à demander
              à la mairie de votre lieu de naissance. Votre livret de famille ou votre carnet de
              santé peuvent aussi la mentionner.
            </p>
          </Disclosure>
        </div>
      ),
    },
  ];

  return (
    <div id="time-step__container--root" className="flex flex-col gap-4">
      <SelectableCardGroup
        id="time-step__cards--precision"
        label="Connaissez-vous votre heure de naissance ?"
        hideLabel
        options={options}
        value={value.precision}
        onChange={(precision) => onChange(withPrecision(value, precision))}
      />
    </div>
  );
}

export default TimeStep;
