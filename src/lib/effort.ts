export type EffortLevel = "lazy" | "trying" | "thinking" | "breakthrough";

const LAZY_PATTERNS = [
  /^(what is|what's|whats) .{0,30}$/i,
  /^(solve|answer|tell me|help me|do|give me|explain)(\s|$)/i,
  /^.{0,10}$/,  // Very short messages
];

const EFFORT_INDICATORS = [
  /i think/i,
  /because/i,
  /so maybe/i,
  /is it/i,
  /i tried/i,
  /i know/i,
  /my attempt/i,
  /i got/i,
  /what if/i,
  /could it be/i,
  /i believe/i,
  /let me try/i,
  /first.*(then|next|after)/i,
  /step \d/i,
  /\d\s*[+\-*/÷×=]\s*\d/,  // Math expressions (showing work)
];

export function classifyEffort(message: string): EffortLevel {
  const trimmed = message.trim();

  // Empty or near-empty
  if (trimmed.length < 5) return "lazy";

  // Check for copy-paste homework dump (long text, no reasoning)
  if (trimmed.length > 200) {
    const hasReasoning = EFFORT_INDICATORS.some((p) => p.test(trimmed));
    const hasQuestionMark = trimmed.includes("?");
    if (!hasReasoning && !hasQuestionMark) return "lazy";
  }

  // Check lazy patterns FIRST — a lazy pattern that happens to contain
  // a math expression (e.g. "what is 2+2") should still be lazy
  const isLazyPattern = LAZY_PATTERNS.some((p) => p.test(trimmed));

  // Count effort signals
  const effortSignals = EFFORT_INDICATORS.filter((p) => p.test(trimmed)).length;

  // Lazy pattern wins unless there are strong effort signals (reasoning + math)
  if (isLazyPattern && effortSignals < 2) return "lazy";

  if (effortSignals >= 3) return "thinking";
  if (effortSignals >= 1) return "trying";

  // Medium-length message with some specificity but no explicit effort markers
  if (trimmed.length > 30 && trimmed.includes("?")) return "trying";

  return "lazy";
}

export function effortToScore(level: EffortLevel): number {
  switch (level) {
    case "lazy":
      return 0;
    case "trying":
      return 1;
    case "thinking":
      return 2;
    case "breakthrough":
      return 3;
  }
}
