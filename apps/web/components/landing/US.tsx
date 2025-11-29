"use client";
import React from "react";
import { EditorialProfile } from "./EditorialProfile";

export function US({ progress = 0 }: { progress?: number }) {
  return (
    <section className="h-full">
      <div className="flex h-full items-center justify-center px-6 py-8">
        <div
          className="w-full"
          style={{
            transform: `translateY(${(1 - progress) * 15}px)`,
            transition: "transform 120ms linear",
          }}
        >
          <EditorialProfile />
        </div>
      </div>
    </section>
  );
}

export default US;
