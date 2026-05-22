import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";

import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  type Attributes,
} from "@/lib/attributes";

type Props = {
  attributes: Attributes;
  max?: number;
  size?: number;
};

export function AttributeRadar({ attributes, max = 12, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  const axes = ATTRIBUTE_KEYS.map((k, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2; // start at 12 o'clock
    const ratio = Math.min(attributes[k] / max, 1);
    return {
      key: k,
      label: ATTRIBUTE_LABELS[k].zh,
      value: attributes[k],
      vx: cx + Math.cos(angle) * r,
      vy: cy + Math.sin(angle) * r,
      dx: cx + Math.cos(angle) * r * ratio,
      dy: cy + Math.sin(angle) * r * ratio,
      lx: cx + Math.cos(angle) * (r + 22),
      ly: cy + Math.sin(angle) * (r + 22),
    };
  });

  const dataPoints = axes.map((a) => `${a.dx},${a.dy}`).join(" ");

  const ringPoints = (scale: number) =>
    axes
      .map(
        (a) =>
          `${cx + (a.vx - cx) * scale},${cy + (a.vy - cy) * scale}`
      )
      .join(" ");

  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <Polygon
          key={s}
          points={ringPoints(s)}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1}
        />
      ))}

      {axes.map((a, i) => (
        <Line
          key={`axis-${i}`}
          x1={cx}
          y1={cy}
          x2={a.vx}
          y2={a.vy}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1}
        />
      ))}

      <Polygon
        points={dataPoints}
        fill="rgba(167, 139, 250, 0.42)"
        stroke="#a78bfa"
        strokeWidth={2}
      />

      {axes.map((a, i) => (
        <Circle
          key={`pt-${i}`}
          cx={a.dx}
          cy={a.dy}
          r={3.5}
          fill="#7c3aed"
        />
      ))}

      {axes.map((a, i) => (
        <SvgText
          key={`lbl-${i}`}
          x={a.lx}
          y={a.ly}
          fontSize={12}
          fill="#52525b"
          textAnchor="middle"
        >
          {a.label}
        </SvgText>
      ))}
    </Svg>
  );
}
