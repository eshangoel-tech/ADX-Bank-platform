"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PinInput({ value, onChange, disabled, autoFocus }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[index] = digit || " ";
    const newPin = arr.join("").trimEnd();
    onChange(newPin);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const arr = value.padEnd(6, " ").split("");
        arr[index] = " ";
        onChange(arr.join("").trimEnd());
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const arr = value.padEnd(6, " ").split("");
        arr[index - 1] = " ";
        onChange(arr.join("").trimEnd());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center" role="group" aria-label="6-digit PIN">
      {Array.from({ length: 6 }).map((_, i) => {
        const filled = i < value.length;
        return (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ""}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`PIN digit ${i + 1}`}
            className="w-11 h-14 rounded-xl text-center text-xl font-bold outline-none transition-all duration-150 cursor-text"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: filled
                ? "2px solid var(--accent)"
                : "2px solid var(--border-default)",
              color: "var(--text-primary)",
              boxShadow: filled ? "0 0 0 3px var(--accent-muted)" : "none",
              caretColor: "transparent",
            }}
          />
        );
      })}
    </div>
  );
}
