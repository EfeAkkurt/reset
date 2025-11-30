"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { colors } from "@/lib/colors";

// Types
type PremiumOpportunity = {
  id: string;
  protocol: string;
  pair: string;
  chain: string;
  apr: number;
  apy: number;
  risk: "Low" | "Medium" | "High";
  tvlUsd: number;
  rewardToken: string;
  lastUpdated: string;
  originalUrl: string;
  // Chart data
  chartData?: Array<{
    timestamp: number;
    apr: number;
    tvlUsd: number;
  }>;
};

// Chart Tooltip Component
const ChartTooltip = ({
  x,
  y,
  value,
  timeLabel,
  isVisible
}: {
  x: number;
  y: number;
  value: number;
  timeLabel: string;
  isVisible: boolean;
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute z-50 px-2 py-1 bg-white rounded-lg shadow-xl border border-slate-200 whitespace-nowrap"
      style={{
        left: x,
        top: y
      }}
    >
      <div className="text-xs font-semibold text-slate-900">{value.toFixed(2)}%</div>
      <div className="text-xs text-slate-500">{timeLabel}</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-t border-slate-200"></div>
    </motion.div>
  );
};

// Smooth Line Chart Component
const SmoothLineChart = ({ data, active, timeRange }: { data: number[]; active: boolean; timeRange: "1D" | "7D" }) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<{ index: number; x: number; y: number } | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };

  const xScale = (index: number) => {
    return padding.left + (index / (data.length - 1)) * (dimensions.width - padding.left - padding.right);
  };

  const yScale = (value: number) => {
    return dimensions.height - padding.bottom - ((value - min) / range) * (dimensions.height - padding.top - padding.bottom);
  };

  // Create smooth curve path
  const createPath = () => {
    if (data.length < 2) return '';

    let path = `M ${xScale(0)} ${yScale(data[0])}`;

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = xScale(i);
      const y1 = yScale(data[i]);
      const x2 = xScale(i + 1);
      const y2 = yScale(data[i + 1]);

      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) * 0.5;
      const cp2y = y2;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }

    return path;
  };

  // Create gradient fill area
  const createAreaPath = () => {
    const linePath = createPath();
    return `${linePath} L ${xScale(data.length - 1)} ${dimensions.height - padding.bottom} L ${xScale(0)} ${dimensions.height - padding.bottom} Z`;
  };

  const formatTime = (index: number) => {
    if (timeRange === "1D") {
      const hour = Math.floor((index / data.length) * 24);
      return `${hour.toString().padStart(2, '0')}:00`;
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      const dayIndex = (today - (data.length - 1 - index) + 7) % 7;
      return days[dayIndex];
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Grid lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = padding.top + (i * (dimensions.height - padding.top - padding.bottom)) / 4;
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={dimensions.width - padding.right}
              y2={y}
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.purple[600]} stopOpacity={0.8} />
            <stop offset="100%" stopColor={colors.purple[700]} stopOpacity={1} />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.purple[600]} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.purple[600]} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {dimensions.width > 0 && (
          <motion.path
            d={createAreaPath()}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        )}

        {/* Line */}
        {dimensions.width > 0 && (
          <motion.path
            d={createPath()}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        )}

        {/* Data points */}
        {dimensions.width > 0 && data.map((value, index) => {
          const x = xScale(index);
          const y = yScale(value);
          const isHovered = hoveredPoint?.index === index;

          return (
            <g key={index}>
              <motion.circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 0}
                fill={colors.purple[600]}
                stroke="white"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(140, 69, 255, 0.4))' }}
                animate={{ r: isHovered ? 5 : 0 }}
                transition={{ duration: 0.2 }}
              />
              <circle
                cx={x}
                cy={y}
                r={20}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setHoveredPoint({
                      index,
                      x: e.clientX - rect.left,
                      y: y - 10
                    });
                  }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && svgRef.current && (
        <ChartTooltip
          x={hoveredPoint.x}
          y={hoveredPoint.y}
          value={data[hoveredPoint.index]}
          timeLabel={formatTime(hoveredPoint.index)}
          isVisible={true}
        />
      )}
    </div>
  );
};

// Main PremiumCard component
export const PremiumCard: React.FC<{ data: PremiumOpportunity }> = ({ data }) => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"1D" | "7D">("7D");
  const [chartData, setChartData] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Generate mock chart data based on time range
  useEffect(() => {
    const points = timeRange === "1D" ? 24 : 7;
    const baseApr = data.apr;
    const volatility = data.risk === "High" ? 5 : data.risk === "Medium" ? 3 : 1.5;

    const mockData = Array.from({ length: points }, (_, i) => {
      const trend = Math.sin(i * 0.5) * volatility;
      const noise = (Math.random() - 0.5) * volatility * 0.5;
      return baseApr + trend + noise;
    });

    setChartData(mockData);
  }, [timeRange, data.apr, data.risk]);

  // Format helpers
  const formatPct = (value: number) => `${value.toFixed(2)}%`;
  const formatTVL = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Risk colors
  const riskConfig = {
    Low: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      dot: "bg-emerald-500",
      border: "border-emerald-500/20"
    },
    Medium: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      dot: "bg-amber-500",
      border: "border-amber-500/20"
    },
    High: {
      bg: "bg-rose-500/10",
      text: "text-rose-500",
      dot: "bg-rose-500",
      border: "border-rose-500/20"
    }
  };

  const riskColor = riskConfig[data.risk];
  const aprTrend = chartData.length > 1 ? chartData[chartData.length - 1] - chartData[0] : 0;

  return (
    <motion.div
      className="group relative flex w-full max-w-md flex-col rounded-2xl bg-slate-950 p-5 shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => router.push(`/opportunities/${data.id}`)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: isHovered ? `0 20px 40px -10px ${colors.purple[600]}40` : '0 10px 20px -5px rgba(0,0,0,0.3)'
      }}
    >
      {/* Gradient background effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-20 blur-md transition-opacity duration-300 group-hover:opacity-30"
        style={{
          background: `linear-gradient(135deg, ${colors.purple[600]}, ${colors.purple[700]})`
        }}
      />
      <div className="absolute inset-px rounded-[11px] bg-slate-950" />

      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.purple[600]}, ${colors.purple[700]})`
              }}
            >
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{data.protocol}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{data.pair}</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid - 2x2 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {/* TVL Card (moved from bottom-right) */}
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-medium text-slate-400">TVL</p>
              <p className="text-lg font-semibold text-white">{formatTVL(data.tvlUsd)}</p>
            </div>
            <div
              className="absolute top-2 right-2 h-3 w-3 rounded-full opacity-20"
              style={{ backgroundColor: colors.purple[600] }}
            />
          </div>

          {/* APR Card */}
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-medium text-slate-400">APR</p>
              <p className="text-lg font-semibold text-white">{formatPct(data.apr)}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {aprTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                )}
                <span className={`text-xs font-medium ${aprTrend > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {Math.abs(aprTrend).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Risk Card (moved from top-left) */}
          <div className={`rounded-lg ${riskColor.bg} ${riskColor.border} border p-3 relative overflow-hidden`}>
            <div className="relative z-10">
              <p className="text-xs font-medium text-slate-400">Risk Level</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-2 w-2 rounded-full ${riskColor.dot}`} />
                <p className={`text-base font-semibold ${riskColor.text}`}>{data.risk}</p>
              </div>
            </div>
            <AlertCircle className={`absolute top-2 right-2 h-3 w-3 ${riskColor.text} opacity-20`} />
          </div>

          {/* APY Card */}
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
            <p className="text-xs font-medium text-slate-400">APY</p>
            <p className="text-base font-semibold text-white">{formatPct(data.apy)}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-4 flex-1">
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3 h-24">
            {/* Chart Header with Toggle */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Performance</span>

              {/* Time Range Toggle */}
              <div className="flex items-center bg-white rounded-lg p-0.5 shadow-sm relative">
                {(["1D", "7D"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange(range);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 relative z-10 ${
                      timeRange === range
                        ? "text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {range}
                  </button>
                ))}

                {/* Animated Slider Indicator */}
                <motion.div
                  className="absolute top-0.5 bottom-0.5 rounded-md shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${colors.purple[600]}, ${colors.purple[700]})`,
                    width: "calc(50% - 4px)"
                  }}
                  animate={{
                    x: timeRange === "1D" ? 2 : "calc(50% + 2px)",
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                />
              </div>
            </div>

            {/* Chart */}
            <SmoothLineChart data={chartData} active={isHovered} timeRange={timeRange} />
          </div>
        </div>

        {/* Footer - Only View Details */}
        <div className="flex justify-center pt-3 border-t border-slate-800">
          <motion.button
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.purple[600]}, ${colors.purple[700]})`,
              boxShadow: `0 4px 14px ${colors.purple[600]}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 6px 20px ${colors.purple[600]}60` }}
            whileTap={{ scale: 0.95 }}
          >
            View Details
            <ChevronRight className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};