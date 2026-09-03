import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type GraphScoreComponentProps = {
  normalizedScore: number;
  scoreColor: string;
  radius: number;
  arcLength: number;
  circumference: number;
  progressLength: number;
  badgeStyle: CSSProperties;
  badgeLabel: string;
  headerContent: ReactNode;
  message?: string | null;
  secondaryBadge?: {
    label: string;
    value: string;
    style?: CSSProperties;
  } | null;
  className?: string;
};

export function GraphScoreComponent({
  normalizedScore,
  scoreColor,
  radius,
  arcLength,
  circumference,
  progressLength,
  badgeStyle,
  badgeLabel,
  headerContent,
  message,
  secondaryBadge = null,
  className = "flex items-center gap-5",
}: GraphScoreComponentProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedProgressLength, setAnimatedProgressLength] = useState(0);

  useEffect(() => {
    const duration = 900;
    const targetScore = Math.max(0, normalizedScore);
    const targetProgressLength = Math.max(0, progressLength);
    const start = performance.now();

    setAnimatedScore(0);
    setAnimatedProgressLength(0);

    let frameId = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(targetScore * easedProgress);
      setAnimatedProgressLength(targetProgressLength * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [normalizedScore, progressLength]);

  return (
    <div className={className}>
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: 140, height: 140 }}
      >
        <svg viewBox="0 0 120 120" width="140" height="140">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="9"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeLinecap="round"
            transform="rotate(135 60 60)"
          />

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="9"
            strokeDasharray={`${animatedProgressLength} ${circumference - animatedProgressLength}`}
            strokeLinecap="round"
            transform="rotate(135 60 60)"
          />
        </svg>

        <div className="absolute flex flex-col items-center leading-none">
          <span className="text-3xl font-bold" style={{ color: scoreColor }}>
            {Math.round(animatedScore)}
          </span>

          <span className="mt-1 text-[10px] text-gray-400">de 1000</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold self-start"
            style={badgeStyle}
          >
            {badgeLabel}
          </span>

          {headerContent}
        </div>

        {message && (
          <p className="whitespace-pre-line text-xs text-gray-500 text-justify">
            {message}
          </p>
        )}

        {secondaryBadge && (
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              backgroundColor: secondaryBadge.style?.backgroundColor ?? "#F8FAFC",
              borderColor: secondaryBadge.style?.borderColor ?? "#E2E8F0",
              color: secondaryBadge.style?.color ?? "#243871",
            }}
          >
            {secondaryBadge.label}
            <strong className="text-[11px]" style={{ color: secondaryBadge.style?.color ?? "#243871" }}>
              {secondaryBadge.value}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}