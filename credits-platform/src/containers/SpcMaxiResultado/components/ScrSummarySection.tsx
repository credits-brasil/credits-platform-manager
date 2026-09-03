import { ReactNode, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ConsultarInsumoDialog } from "./ConsultarInsumoDialog";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

type ScrOperacao = {
  quantidade?: string | number | null;
  "data-inicio-relacionamento"?: string | number | null;
  "valor-total-contratado-inicial"?: string | number | null;
  "valor-total-contratado-final"?: string | number | null;
  "quantidade-instituicao-scr"?: string | number | null;
  resumoQuantidadeTotal?: string | number | null;
};

type ScrSummarySectionProps = {
  hasScrData: boolean;
  scrOperacao: ScrOperacao;
  onConsultar?: () => void;
  isConsulting?: boolean;
  consultationDisabled?: boolean;
  isUnavailable?: boolean;
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
    ? numericToken.split(",")[1]?.length ?? 0
    : 0;

  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + numericToken.length),
    target,
    decimals,
  };
}

function AnimatedScrValue({ value }: { value: string | number }) {
  const parsed = useMemo(() => {
    if (typeof value === "number") {
      return {
        prefix: "",
        suffix: "",
        target: value,
        decimals: Number.isInteger(value) ? 0 : 2,
      } as ParsedDisplayNumber;
    }

    return parseDisplayNumber(value);
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

function ScrDataItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  const safeValue = value ?? "-";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>

      <span className="text-base font-bold text-gray-800">
        {typeof safeValue === "string" || typeof safeValue === "number" ? (
          <AnimatedScrValue value={safeValue} />
        ) : (
          "-"
        )}
      </span>
    </div>
  );
}

export function ScrSummarySection({
  hasScrData,
  scrOperacao,
  onConsultar,
  isConsulting = false,
  consultationDisabled = false,
  isUnavailable = false,
}: ScrSummarySectionProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const items = [
    {
      label: "Quantidade total",
      value: scrOperacao.resumoQuantidadeTotal ?? scrOperacao.quantidade ?? "-",
    },
    {
      label: "Data início relacionamento",
      value: formatDate(String(scrOperacao["data-inicio-relacionamento"] ?? "")),
    },
    {
      label: "Valor contratado",
      value: `${formatCurrency(scrOperacao["valor-total-contratado-inicial"] ?? undefined)} a ${formatCurrency(scrOperacao["valor-total-contratado-final"] ?? undefined)}`,
    },
    {
      label: "Quantidade instituição",
      value: scrOperacao["quantidade-instituicao-scr"] ?? "-",
    },
  ];

  function AnimatedResumoValue({ value }: { value: string | number | ReactNode }) {
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

  return (
    <>
      <ConsultarInsumoDialog
        open={showConfirmation}
        label="Operações no SCR"
        isConsulting={isConsulting}
        disabled={consultationDisabled}
        onOpenChange={setShowConfirmation}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={() => {
          onConsultar?.();
          setShowConfirmation(false);
        }}
      />

      <div className="flex h-full w-full flex-col gap-2 self-stretch">
        {hasScrData && !isUnavailable ? (
          <div className="grid h-full grid-cols-4 gap-2">
            {items.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "#F8F9FB" }}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  {label}
                </span>

                {typeof value === "string" || typeof value === "number" ? (
                  <span className="text-base font-bold text-gray-800">
                    <AnimatedResumoValue value={value} />
                  </span>
                ) : (
                  value
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-xl w-full bg-slate-50 p-3 max-w-[10%]">

            {isUnavailable ? (
              <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                Não há dados disponíveis
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmation(true)}
                disabled={isConsulting || consultationDisabled}
                className="flex w-fit items-center gap-2 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: "#C7D2FE", color: "#243871" }}
              >
                {isConsulting ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#243871] border-t-transparent" />
                ) : (
                  <Search size={11} />
                )}
                {isConsulting ? "Consultando..." : "Consultar"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
