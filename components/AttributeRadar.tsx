"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  type Attributes,
} from "@/lib/attributes";

type Props = {
  attributes: Attributes;
  /** Outer ring value. Default 12 (a bit higher than Mia's highest, 11). */
  max?: number;
  height?: number;
};

export function AttributeRadar({ attributes, max = 12, height = 320 }: Props) {
  const data = ATTRIBUTE_KEYS.map((k) => ({
    axis: ATTRIBUTE_LABELS[k].zh,
    value: attributes[k],
    fullMark: max,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart
        data={data}
        margin={{ top: 16, right: 32, bottom: 16, left: 32 }}
      >
        <PolarGrid stroke="rgba(0,0,0,0.12)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 13, fill: "#52525b" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, max]}
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
        />
        <Radar
          name="Mia"
          dataKey="value"
          stroke="#a78bfa"
          strokeWidth={2}
          fill="#a78bfa"
          fillOpacity={0.42}
          isAnimationActive={true}
          animationDuration={800}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e4e4e7",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#27272a", fontWeight: 600 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
