"use client";

import { motion, useReducedMotion } from "framer-motion";

export function TypingIndicator() {
  const reduced = useReducedMotion();

  return (
    <div className="flex items-center gap-1 px-1 h-4" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        reduced ? (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--text-tertiary)" }}
          />
        ) : (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--text-tertiary)" }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        )
      ))}
    </div>
  );
}
