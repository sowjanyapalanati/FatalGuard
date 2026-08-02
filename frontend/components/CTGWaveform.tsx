"use client";

import React, { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';

interface CTGDataPoint {
  timestamp: string;
  baseline_value: number;
  uterine_contractions: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
}

interface Props {
  patientId: string;
  data: CTGDataPoint[];
  currentRisk: "LOW" | "MEDIUM" | "HIGH";
}

const RISK_COLORS = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

export const CTGWaveform = React.memo(function CTGWaveform({ patientId, data, currentRisk }: Props) {
  const color = RISK_COLORS[currentRisk];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    const fhrData = data.map((d, i) => [i, d.baseline_value]);
    const ucData = data.map((d, i) => [i, d.uterine_contractions]);

    const textColor = isDark ? '#e2e8f0' : '#334155';
    const axisColor = isDark ? '#64748b' : '#64748b';
    const gridLineColor = isDark ? '#334155' : '#e2e8f0';
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

    return {
      grid: {
        top: 20,
        right: 15,
        bottom: 25,
        left: 45,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor }
      },
      xAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: Math.max(data.length - 1, 1),
      },
      yAxis: [
        {
          type: 'value',
          min: 60,
          max: 200,
          interval: 30,
          splitLine: {
            lineStyle: { color: gridLineColor, type: 'dashed', width: 0.5 }
          },
          axisLabel: { color: axisColor, fontSize: 9 },
          name: 'FHR',
          nameTextStyle: { color: axisColor, fontSize: 9 }
        },
        {
          type: 'value',
          min: 0,
          max: 100,
          splitLine: { show: false },
          axisLabel: { show: false }
        }
      ],
      series: [
        {
          name: 'FHR',
          type: 'line',
          yAxisIndex: 0,
          data: fhrData,
          smooth: 0.4,
          lineStyle: { width: 2, color: color },
          itemStyle: { color: color },
          symbol: 'none',
          markArea: {
            itemStyle: {
              color: 'rgba(34, 197, 94, 0.05)'
            },
            data: [
              [{ yAxis: 110 }, { yAxis: 160 }]
            ]
          },
          markPoint: data.length > 0 ? {
            data: [{
              coord: [data.length - 1, data[data.length - 1].baseline_value],
              symbol: 'circle',
              symbolSize: 8,
              itemStyle: {
                color: color,
                shadowBlur: 10,
                shadowColor: color
              }
            }]
          } : undefined
        },
        {
          name: 'UC',
          type: 'line',
          yAxisIndex: 1,
          data: ucData,
          smooth: 0.4,
          lineStyle: { width: 1, color: '#6366f1' },
          areaStyle: {
            color: 'rgba(99, 102, 241, 0.3)'
          },
          symbol: 'none'
        }
      ],
      animation: false
    };
  }, [data, currentRisk, color, isDark]);

  if (!mounted) return <div className="h-[200px] w-full animate-pulse bg-surface-secondary/50 rounded-xl" />;

  return (
    <div className="ctg-container relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
          Live CTG — {patientId}
        </h3>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: color + "20",
            color: color,
          }}
        >
          {currentRisk} RISK
        </span>
      </div>
      
      <div className="h-[200px] w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge={false}
          lazyUpdate={true}
        />
      </div>

      <div className="flex gap-6 mt-2 text-[10px] text-foreground/50 absolute bottom-2 left-4">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
          FHR
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-indigo-500/30 rounded" />
          Uterine Contractions
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500/10 rounded border border-green-500/20" />
          Normal Range (110-160)
        </span>
      </div>
    </div>
  );
});
