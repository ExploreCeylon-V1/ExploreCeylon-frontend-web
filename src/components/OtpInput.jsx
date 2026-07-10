import { useEffect, useRef } from "react";

/**
 * Six-box OTP input: digits only, auto-advances focus as you type, Backspace
 * steps back into the previous box, and pasting the full code fills every box
 * at once. No external library — just refs, matching this app's convention of
 * hand-rolled form controls.
 */
export default function OtpInput({ length = 6, value, onChange, disabled, autoFocus }) {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function handleChange(index, e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    // A single keystroke normally, but some mobile keyboards/autofill can drop
    // multiple digits into one box at once — spread them forward from here.
    const next = digits.slice();
    let cursor = index;
    for (const ch of raw.split("")) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor++;
    }
    onChange(next.join("").slice(0, length));
    inputsRef.current[Math.min(cursor, length - 1)]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1} of ${length}`}
          className="h-14 w-full rounded-2xl border-[1.5px] border-slate-200 bg-white text-center text-xl font-bold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:text-2xl"
        />
      ))}
    </div>
  );
}
