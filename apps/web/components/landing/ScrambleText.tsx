"use client";

import React, { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function ScrambleText({ text, className = "", delay = 0 }: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    if (!inView) return;

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    const timeout = setTimeout(() => {
      // Start delay
    }, delay * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [inView, text, delay]);

  return (
    <span ref={ref} className={className}>
      {displayText || text.split("").map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")}
    </span>
  );
}
