import { useTranslation } from "react-i18next";
import type { SkyBodyPosition } from "../skyChart/skyChart";
import {
  BODY_GLYPHS,
  polarPoint,
  screenAngle,
  sectorPath,
  SIGN_GLYPHS,
  spreadLongitudes,
  WHEEL_RADII,
  WHEEL_SIZE,
  wheelRotation,
} from "../skyGeometry/skyGeometry";
import { ZODIAC_SIGNS } from "../../../../shared/zodiac/zodiac.ts";

interface Props {
  id: string;
  bodies: SkyBodyPosition[];
  ascendantLongitude: number | null;
  cusps: number[] | null;
}

const SIGN_SPAN = 30;
const HOUSE_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

function SkyWheel({ id, bodies, ascendantLongitude, cusps }: Props) {
  const { t } = useTranslation(["chart", "astrology"]);
  const rotation = wheelRotation(ascendantLongitude);
  const displayLongitudes = spreadLongitudes(bodies.map((body) => body.longitude));
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <svg
      id={id}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
      className="mx-auto h-auto w-full max-w-sm text-line"
    >
      <title id={titleId}>{t("chart:myChart.sky.wheel.title")}</title>
      <desc id={descId}>
        {cusps
          ? t("chart:myChart.sky.wheel.descriptionWithHouses")
          : t("chart:myChart.sky.wheel.descriptionWithoutHouses")}
      </desc>

      {ZODIAC_SIGNS.map((sign, index) => {
        const start = screenAngle(index * SIGN_SPAN, rotation);
        const end = start + SIGN_SPAN;
        const glyph = polarPoint(start + SIGN_SPAN / 2, (WHEEL_RADII.outer + WHEEL_RADII.signInner) / 2);
        return (
          <g key={sign} id={`${id}-sign--${sign}`} aria-hidden="true">
            <path
              d={sectorPath(start, end, WHEEL_RADII.signInner, WHEEL_RADII.outer)}
              className={index % 2 === 0 ? "fill-violet-soft" : "fill-surface"}
              stroke="currentColor"
              strokeWidth={0.5}
            />
            <text
              x={glyph.x}
              y={glyph.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              className="fill-violet-ink"
            >
              {SIGN_GLYPHS[sign]}
            </text>
          </g>
        );
      })}

      <circle
        cx={WHEEL_SIZE / 2}
        cy={WHEEL_SIZE / 2}
        r={WHEEL_RADII.signInner}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.75}
        aria-hidden="true"
      />
      <circle
        cx={WHEEL_SIZE / 2}
        cy={WHEEL_SIZE / 2}
        r={WHEEL_RADII.inner}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.75}
        aria-hidden="true"
      />

      {cusps && (
        <g id={`${id}-houses`} aria-hidden="true">
          {cusps.map((cusp, index) => {
            const angle = screenAngle(cusp, rotation);
            const from = polarPoint(angle, WHEEL_RADII.inner);
            const to = polarPoint(angle, WHEEL_RADII.signInner);
            const next = cusps[(index + 1) % cusps.length];
            const span = ((next - cusp + 360) % 360) / 2;
            const label = polarPoint(angle + span, WHEEL_RADII.houseNumber);
            return (
              <g key={HOUSE_NUMBERS[index]} id={`${id}-house--${HOUSE_NUMBERS[index]}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="currentColor"
                  strokeWidth={index % 3 === 0 ? 1.5 : 0.6}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  className="fill-ink-muted"
                >
                  {HOUSE_NUMBERS[index]}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {bodies.map((body, index) => {
        const marker = polarPoint(screenAngle(displayLongitudes[index], rotation), WHEEL_RADII.planet);
        const tick = polarPoint(screenAngle(body.longitude, rotation), WHEEL_RADII.signInner);
        const tickInner = polarPoint(screenAngle(body.longitude, rotation), WHEEL_RADII.signInner - 5);
        return (
          <g key={body.body} id={`${id}-body--${body.body}`} aria-hidden="true">
            <line
              x1={tick.x}
              y1={tick.y}
              x2={tickInner.x}
              y2={tickInner.y}
              stroke="currentColor"
              strokeWidth={1}
            />
            <circle cx={marker.x} cy={marker.y} r={9} className="fill-white stroke-violet" strokeWidth={0.75} />
            <text
              x={marker.x}
              y={marker.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              className="fill-ink"
            >
              {BODY_GLYPHS[body.body]}
            </text>
          </g>
        );
      })}

      {ascendantLongitude !== null && (
        <text
          id={`${id}-ascendant-label`}
          x={2}
          y={WHEEL_SIZE / 2 - 6}
          fontSize={9}
          fontWeight={700}
          className="fill-violet-ink"
          aria-hidden="true"
        >
          {t("astrology:placement.ascendantShort")}
        </text>
      )}
    </svg>
  );
}

export default SkyWheel;
