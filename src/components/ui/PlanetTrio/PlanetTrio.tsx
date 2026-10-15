import { cx } from "../../../lib/cx";

export interface Placement {
  sign: string;
  detail?: string;
}

interface Props {
  id: string;
  sun: Placement;
  moon: Placement;
  ascendant: Placement | null;
  unknownLabel?: string;
}

const items = [
  { key: "sun", label: "Soleil", classes: "bg-gold-soft text-gold-ink" },
  { key: "moon", label: "Lune", classes: "bg-sky-soft text-sky-ink" },
  { key: "ascendant", label: "Ascendant", classes: "bg-violet-soft text-violet-ink" },
] as const;

function PlanetTrio({ id, sun, moon, ascendant, unknownLabel = "Inconnu" }: Props) {
  const placements = { sun, moon, ascendant };

  return (
    <dl id={id} className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const placement = placements[item.key];
        return (
          <div
            key={item.key}
            className={cx("flex flex-col gap-0.5 rounded-card px-3 py-3", item.classes)}
          >
            <dt className="font-display text-xs font-semibold">{item.label}</dt>
            <dd className="font-display text-base font-bold text-ink">
              {placement?.sign ?? unknownLabel}
            </dd>
            {placement?.detail && (
              <dd className="text-xs text-ink-secondary">{placement.detail}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}

export default PlanetTrio;
