"use client";
import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Additional recharts components not covered in the base file
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);

const Cell = dynamic(
  () => import("recharts").then((mod) => mod.Cell),
  { ssr: false }
);

const ReferenceDot = dynamic(
  () => import("recharts").then((mod) => mod.ReferenceDot),
  { ssr: false }
);

// Export additional components
export {
  Bar,
  Cell,
  ReferenceDot,
};

// Re-export all base components
export {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "./DynamicRecharts";