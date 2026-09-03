import { useEffect, useState, type ReactNode } from "react";

type PercentageProgressIndicatorComponentProps = {
  title: string;
  percentage: number;
  barColor: string;
  footer?: ReactNode;
  className?: string;
};

export function PercentageProgressIndicatorComponent({
  title,
  percentage,
  barColor,
  footer,
  className = "flex h-full justify-between flex-col rounded-md border border-gray-100 p-1.5",
}: PercentageProgressIndicatorComponentProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();

    setAnimatedPercentage(0);

    let frameId = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedPercentage(normalizedPercentage * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [normalizedPercentage]);

  return (
    <div
      className={["flex h-full w-full flex-col justify-between", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex justify-between w-full h-full flex-col px-3 py-2.5 gap-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-[12px] font-medium text-gray-600">{title}</span>

          {footer ? <div>{footer}</div> : null}
        </div>

        <div className="flex w-full items-center justify-between gap-2">
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full"
              style={{
                width: `${animatedPercentage}%`,
                backgroundColor: barColor,
              }}
            />
          </div>

          <span className="w-[52px] shrink-0 text-right text-[10px] font-semibold text-gray-700">
            {animatedPercentage.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
