import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface FeatureRadarChartProps {
  features: Record<string, number>;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export function FeatureRadarChart({ features, riskLevel }: FeatureRadarChartProps) {
  // Normalize key features to a 0-100 scale for visual comparison
  // (In a real app, these max values would be based on clinical bounds)
  const data = [
    {
      subject: "Baseline (bpm)",
      value: Math.min((features.baseline_value || 0) / 2, 100),
      fullMark: 100,
    },
    {
      subject: "ASTV (%)",
      value: Math.min(features.abnormal_short_term_variability || 0, 100),
      fullMark: 100,
    },
    {
      subject: "ALTV (%)",
      value: Math.min(features.percentage_of_time_with_abnormal_long_term_variability || 0, 100),
      fullMark: 100,
    },
    {
      subject: "Decelerations",
      value: Math.min(((features.light_decelerations || 0) + (features.severe_decelerations || 0)) * 10000, 100),
      fullMark: 100,
    },
    {
      subject: "Accelerations",
      value: Math.min((features.accelerations || 0) * 10000, 100),
      fullMark: 100,
    },
    {
      subject: "Uterine Contr.",
      value: Math.min((features.uterine_contractions || 0) * 10000, 100),
      fullMark: 100,
    }
  ];

  const getStrokeColor = () => {
    switch (riskLevel) {
      case "HIGH": return "#ef4444"; // red
      case "MEDIUM": return "#f59e0b"; // amber
      default: return "#22c55e"; // green
    }
  };

  const color = getStrokeColor();

  return (
    <div className="w-full h-full min-h-[250px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--surface-border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground)', fontSize: 10, opacity: 0.7 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--surface-primary)', 
              borderColor: 'var(--surface-border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }} 
          />
          <Radar
            name="Patient Stats"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
