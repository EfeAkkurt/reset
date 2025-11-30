"use client";
import { useState, useEffect } from "react";

interface ChartWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ChartWrapper({ children, fallback = <div className="animate-pulse bg-gray-200 rounded-lg h-64" /> }: ChartWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}