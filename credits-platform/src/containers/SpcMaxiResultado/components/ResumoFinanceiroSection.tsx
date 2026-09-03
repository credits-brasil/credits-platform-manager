import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { ConsultarInsumoDialog } from "./ConsultarInsumoDialog";

type ResumoFinanceiroItem = {
  label: string;
  value: string | number | ReactNode;
  insumoId?: string;
};

type ResumoFinanceiroSectionProps = {
  items: ResumoFinanceiroItem[];
  onConsultar?: (item: ResumoFinanceiroItem) => void;
  isConsulting?: boolean;
  consultationDisabled?: boolean;
  loadingItemLabel?: string | null;
  unavailableLabels?: string[];
};

type ParsedDisplayNumber = {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
};

function parseDisplayNumber(value: string): ParsedDisplayNumber | null {
  const match = value.match(/-?\d{1,3}(?:\.\d{3})*(?:,\d+)?|-?\d+(?:[.,]\d+)?/);
  if (!match || match.index === undefined) {
    return null;
  }

  const numericToken = match[0];
  const normalizedToken = numericToken.replace(/\./g, "").replace(",", ".");
  const target = Number(normalizedToken);
  if (!Number.isFinite(target)) {
    return null;
  }

  const decimals = numericToken.includes(",")
    ? (numericToken.split(",")[1]?.length ?? 0)
    : 0;

  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + numericToken.length),
    target,
    decimals,
  };
}

function ConsultarInsumosButton({
  onClick,
  loading = false,
  disabled = false,
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-fit items-center gap-2 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      style={{ backgroundColor: "#C7D2FE", color: "#243871" }}
    >
      {loading ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#243871] border-t-transparent" />
      ) : (
        <Search size={11} />
      )}
      {loading ? "Consultando..." : "Consultar"}
    </button>

    // <button
    //   type="button"
    //   onClick={onClick}
    //   disabled={disabled || loading}
    //   className="inline-flex w-fit items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#243871]/20 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
    //   style={{
    //     borderColor: "#C7D2FE",
    //     backgroundColor: "#EEF2FF",
    //     color: "#243871",
    //   }}
    // >
    //   {loading ? (
    //     <span
    //       className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
    //       style={{ borderColor: "#243871", borderTopColor: "transparent" }}
    //     />
    //   ) : (
    //     <Search size={11} style={{ color: "#243871" }} />
    //   )}

    //   {loading ? "Consultando..." : "Consultar"}
    // </button>
  );
}

function AnimatedResumoValue({
  value,
}: {
  value: string | number | ReactNode;
}) {
  const parsed = useMemo(() => {
    if (typeof value === "number") {
      return {
        prefix: "",
        suffix: "",
        target: value,
        decimals: Number.isInteger(value) ? 0 : 2,
      } as ParsedDisplayNumber;
    }

    if (typeof value === "string") {
      return parseDisplayNumber(value);
    }

    return null;
  }, [value]);

  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!parsed) {
      return;
    }

    const duration = 900;
    const start = performance.now();

    setAnimatedValue(0);

    let frameId = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedValue(parsed.target * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [parsed]);

  if (!parsed) {
    return <>{value}</>;
  }

  const formattedNumber = Math.max(animatedValue, 0).toLocaleString("pt-BR", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return <>{`${parsed.prefix}${formattedNumber}${parsed.suffix}`}</>;
}

export function ResumoFinanceiroSection({
  items,
  onConsultar,
  isConsulting = false,
  consultationDisabled = false,
  loadingItemLabel = null,
  unavailableLabels = [],
}: ResumoFinanceiroSectionProps) {
  const [pendingItem, setPendingItem] = useState<ResumoFinanceiroItem | null>(
    null,
  );
  const isBlocked = isConsulting || consultationDisabled;

  useEffect(() => {
    if (isBlocked) {
      setPendingItem(null);
    }
  }, [isBlocked]);

  const handleConfirmConsult = () => {
    if (!pendingItem || isBlocked) return;

    onConsultar?.(pendingItem);
    setPendingItem(null);
  };

  return (
    <>
      <ConsultarInsumoDialog
        open={Boolean(pendingItem)}
        label={pendingItem?.label}
        isConsulting={isConsulting}
        disabled={consultationDisabled}
        onOpenChange={(open) => {
          if (!open) setPendingItem(null);
        }}
        onCancel={() => setPendingItem(null)}
        onConfirm={handleConfirmConsult}
      />

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-2">
          {items.map((item) => {
            const { label, value } = item;
            const shouldRenderActionButton =
              value === null ||
              value === undefined ||
              value === "" ||
              value === "–" ||
              value === "—";

            return (
              <div
                key={label}
                className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "#F8F9FB" }}
              >
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {label}
                </span>

                {shouldRenderActionButton &&
                !unavailableLabels.includes(label) ? (
                  <ConsultarInsumosButton
                    onClick={() => {
                      if (!isBlocked) {
                        setPendingItem(item);
                      }
                    }}
                    loading={loadingItemLabel === item.label}
                    disabled={isBlocked}
                  />
                ) : unavailableLabels.includes(label) ? (
                  <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                    Não há dados disponíveis
                  </span>
                ) : typeof value === "string" || typeof value === "number" ? (
                  <span className="text-base font-bold text-gray-800">
                    <AnimatedResumoValue value={value} />
                  </span>
                ) : (
                  value
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
