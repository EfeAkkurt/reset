"use client";
import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Types for recharts components
interface ResponsiveContainerProps {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  aspect?: number;
}

interface ComposedChartProps {
  data: any[];
  children: React.ReactNode;
  margin?: any;
}

interface AreaProps {
  dataKey: string;
  stroke?: string;
  fill?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

interface LineProps {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: boolean;
}

interface XAxisProps {
  dataKey: string;
  stroke?: string;
}

interface YAxisProps {
  stroke?: string;
}

interface TooltipProps {
  contentStyle?: any;
  content?: any;
}

interface CartesianGridProps {
  strokeDasharray?: string;
  stroke?: string;
}

// Dynamically import recharts components to avoid SSR issues
const ResponsiveContainer = dynamic<ComponentType<ResponsiveContainerProps>>(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

const ComposedChart = dynamic<ComponentType<ComposedChartProps>>(
  () => import("recharts").then((mod) => mod.ComposedChart),
  { ssr: false }
);

const Area = dynamic<ComponentType<AreaProps>>(
  () => import("recharts").then((mod) => mod.Area),
  { ssr: false }
);

const Line = dynamic<ComponentType<LineProps>>(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);

const XAxis = dynamic<ComponentType<XAxisProps>>(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);

const YAxis = dynamic<ComponentType<YAxisProps>>(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);

const Tooltip = dynamic<ComponentType<TooltipProps>>(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);

const CartesianGrid = dynamic<ComponentType<CartesianGridProps>>(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

// Export all components
export {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
};