import { ShieldAlert } from "lucide-react";

export interface AlertaItem {
  titulo: string;
  severidade: "alto" | "medio" | "baixo";
  descricao: string;
  detalhes?: Array<{ label: string; value: string | number }>;
  fonte: string;
  tipo: string;
}

interface AlertasSectionProps {
  alertas: AlertaItem[];
}

export function AlertasSection({ alertas }: AlertasSectionProps) {
  if (!alertas.length) return null;

  return (
    <div
      id="section-alertas"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Alertas</h2>

      <div className="grid grid-cols-2 gap-3">
        {alertas.map((a, i) => {
          const cfg =
            a.severidade === "alto"
              ? {
                  bg: "#FEF2F2",
                  border: "#FECACA",
                  icon: "#DC2626",
                  badge: { bg: "#FEE2E2", color: "#DC2626" },
                }
              : a.severidade === "medio"
                ? {
                    bg: "#FFFBEB",
                    border: "#FDE68A",
                    icon: "#D97706",
                    badge: { bg: "#FEF3C7", color: "#D97706" },
                  }
                : {
                    bg: "#F0FDF4",
                    border: "#BBF7D0",
                    icon: "#16A34A",
                    badge: { bg: "#DCFCE7", color: "#16A34A" },
                  };

          return (
            <div
              key={`${a.titulo}-${i}`}
              className="rounded-xl border p-4"
              style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert
                  size={18}
                  style={{ color: cfg.icon, flexShrink: 0, marginTop: 1 }}
                />

                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {a.titulo}
                    </span>

                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap"
                      style={{
                        backgroundColor: cfg.badge.bg,
                        color: cfg.badge.color,
                      }}
                    >
                      {a.severidade}
                    </span>
                  </div>

                  <p className="mb-2 text-xs text-gray-500">{a.descricao}</p>

                  {a.detalhes?.length ? (
                    <div className="mb-2 flex items-center justify-between gap-6">
                      {a.detalhes.map((detalhe) => (
                        <div key={`${a.titulo}-${detalhe.label}`}>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                            {detalhe.label}
                          </p>

                          <p className="text-xs text-gray-700">
                            {detalhe.value || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{a.fonte}</span>
                    <span>{a.tipo}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
