import React from 'react';
import { BarChart2, TrendingUp, Radio, Activity, Zap } from 'lucide-react';
import { LanguageCode } from '../types';

interface AnalyticsChartsProps {
  language: LanguageCode;
  highContrast: boolean;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  highContrast
}) => {
  // Weekly Safety Score Data (0 - 100)
  const weeklySafetyData = [
    { day: 'Mon', score: 98, km: 64, relays: 2 },
    { day: 'Tue', score: 96, km: 72, relays: 3 },
    { day: 'Wed', score: 99, km: 58, relays: 1 },
    { day: 'Thu', score: 94, km: 81, relays: 4 },
    { day: 'Fri', score: 97, km: 90, relays: 3 },
    { day: 'Sat', score: 100, km: 68, relays: 0 },
    { day: 'Sun', score: 98, km: 45, relays: 1 }
  ];

  // Hop Latency Distribution (ms vs hops)
  const hopData = [
    { hops: '0 Hops (Direct)', count: 48, latencyMs: 1.2 },
    { hops: '1 Hop (Near Auto)', count: 34, latencyMs: 3.8 },
    { hops: '2 Hops (Mid Auto)', count: 18, latencyMs: 8.5 },
    { hops: '3+ Hops (Gateway)', count: 9, latencyMs: 14.2 }
  ];

  // BLE Signal Attenuation Curve (Distance vs RSSI dBm)
  const rssiCurve = [
    { dist: 5, rssi: -42 },
    { dist: 15, rssi: -55 },
    { dist: 30, rssi: -66 },
    { dist: 50, rssi: -74 },
    { dist: 80, rssi: -82 },
    { dist: 120, rssi: -89 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Chart 1: Daily Safety Score Trend & Kilometers */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              7-Day Corridor Safety Score & Clean Kilometers
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Average: 97.4% Clean Corridor
          </span>
        </div>

        {/* SVG Bar & Line Composite Chart */}
        <div className="relative h-44 w-full">
          <svg viewBox="0 0 700 160" className="w-full h-full">
            {/* Grid Lines */}
            <line x1="40" y1="20" x2="680" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1="40" y1="60" x2="680" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1="40" y1="100" x2="680" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1="40" y1="140" x2="680" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* Y-Axis Labels */}
            <text x="30" y="24" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">100</text>
            <text x="30" y="64" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">75</text>
            <text x="30" y="104" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">50</text>

            {/* Bars for Kilometers */}
            {weeklySafetyData.map((d, i) => {
              const x = 70 + i * 90;
              const barHeight = (d.km / 100) * 110;
              const y = 140 - barHeight;
              return (
                <g key={i}>
                  <rect
                    x={x - 14}
                    y={y}
                    width="28"
                    height={barHeight}
                    rx="4"
                    fill="rgba(245, 158, 11, 0.2)"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y="154"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="Plus Jakarta Sans"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {d.day}
                  </text>
                  <text
                    x={x}
                    y={y - 5}
                    fill="#f59e0b"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {d.km}km
                  </text>
                </g>
              );
            })}

            {/* Line for Safety Score */}
            <path
              d={weeklySafetyData.reduce((acc, curr, i) => {
                const x = 70 + i * 90;
                const y = 140 - ((curr.score - 50) / 50) * 110;
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Data Points */}
            {weeklySafetyData.map((d, i) => {
              const x = 70 + i * 90;
              const y = 140 - ((d.score - 50) / 50) * 110;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#0b0f19"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500/40 border border-amber-500 rounded-sm inline-block" />
              <span>Safe Kilometers</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
              <span>Safety Corridor Adherence Score (%)</span>
            </span>
          </div>
          <span>Zero False Positives</span>
        </div>
      </div>

      {/* Chart 2: Hop Latency & Signal Attenuation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hop Latency Distribution */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                BLE Mesh Hop Latency
              </h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">Avg: 3.4ms</span>
          </div>

          <div className="space-y-3">
            {hopData.map((h, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{h.hops}</span>
                  <span className="text-cyan-300">{h.latencyMs} ms · ({h.count} rel.)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                    style={{ width: `${(h.count / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLE Signal Attenuation vs Ground Distance */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                RF Attenuation (Distance vs RSSI)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400">Cutoff: -92 dBm</span>
          </div>

          <div className="space-y-3">
            {rssiCurve.map((r, i) => {
              const quality = r.rssi > -65 ? 'Excellent' : r.rssi > -80 ? 'Good' : 'Fringe';
              const color = r.rssi > -65 ? 'text-emerald-400' : r.rssi > -80 ? 'text-amber-400' : 'text-red-400';
              return (
                <div key={i} className="flex items-center justify-between text-xs font-mono border-b border-slate-900 pb-1.5">
                  <span className="text-slate-300">{r.dist} meters</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{r.rssi} dBm</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-900 border border-slate-800 ${color}`}>
                      {quality}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
