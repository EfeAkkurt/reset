"use client";

import React from "react";
import { motion } from "framer-motion";

export default function EndCapFooter() {
  return (
    <div
      className="relative w-full flex flex-col items-center justify-center min-h-[40vh]"
      style={{ marginTop: "-15vh", transform: "translateY(-50px)" }}
    >
      <motion.h1
        aria-hidden
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="reset-title"
      >
        Reset
      </motion.h1>

      </div>
  );
}
